import mongoose from 'mongoose';
import Order, { ORDER_STATUS, STATUS_FLOW } from '../models/Order.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getPagination, escapeRegex } from '../utils/pagination.js';

const generateCode = async () => {
  for (let i = 0; i < 5; i += 1) {
    const code = `#${Math.floor(100000 + Math.random() * 900000)}`;
    if (!(await Order.exists({ code }))) return code;
  }
  return `#${Date.now()}`;
};

const populateOrder = (query) =>
  query
    .populate('customer', 'name phone address email')
    .populate('createdBy', 'name email role')
    .populate('statusHistory.changedBy', 'name');

// GET /api/orders?search=&status=&from=&to=&page=&limit=
export const getOrders = asyncHandler(async (req, res) => {
  const { search, status, from, to } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (status && ORDER_STATUS.includes(status)) filter.status = status;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    const customers = await Customer.find({ $or: [{ name: regex }, { phone: regex }] }).select('_id');
    filter.$or = [{ code: regex }, { customer: { $in: customers.map((c) => c._id) } }];
  }

  const [data, total] = await Promise.all([
    Order.find(filter)
      .populate('customer', 'name phone address')
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await populateOrder(Order.findById(req.params.id));
  if (!order) throw new ApiError(404, 'Không tìm thấy đơn hàng');
  res.json({ data: order });
});

/**
 * POST /api/orders
 * body: {
 *   customerId?: string,                       // chọn khách có sẵn
 *   customer?: { name, phone, address, email } // hoặc nhập khách mới (tìm theo SĐT, chưa có thì tạo)
 *   items: [{ product: id, quantity: number }],
 *   note?: string
 * }
 * Giá được lấy từ DB, không tin giá client gửi lên.
 */
export const createOrder = asyncHandler(async (req, res) => {
  const { customerId, customer: customerInput, items, note } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'Đơn hàng phải có ít nhất 1 sản phẩm');
  }

  // 1. Khách hàng
  let customer;
  if (customerId) {
    customer = await Customer.findById(customerId);
    if (!customer) throw new ApiError(400, 'Khách hàng không tồn tại');
  } else if (customerInput?.phone) {
    customer = await Customer.findOne({ phone: customerInput.phone.trim() });
    if (!customer) customer = await Customer.create(customerInput);
  } else {
    throw new ApiError(400, 'Vui lòng chọn hoặc nhập thông tin khách hàng');
  }

  // 2. Gộp sản phẩm trùng và kiểm tra
  const quantities = new Map();
  for (const item of items) {
    const qty = Number(item.quantity);
    if (!mongoose.isValidObjectId(item.product)) throw new ApiError(400, 'Mã sản phẩm không hợp lệ');
    if (!Number.isInteger(qty) || qty < 1) throw new ApiError(400, 'Số lượng phải là số nguyên ≥ 1');
    quantities.set(String(item.product), (quantities.get(String(item.product)) || 0) + qty);
  }

  const products = await Product.find({ _id: { $in: [...quantities.keys()] } });
  if (products.length !== quantities.size) throw new ApiError(400, 'Có sản phẩm không tồn tại');

  const orderItems = products.map((p) => {
    if (p.status !== 'available') throw new ApiError(400, `Sản phẩm "${p.name}" đang ngừng bán`);
    return { product: p._id, name: p.name, price: p.price, quantity: quantities.get(String(p._id)) };
  });
  const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // 3. Tạo đơn
  const order = await Order.create({
    code: await generateCode(),
    customer: customer._id,
    items: orderItems,
    total,
    note,
    createdBy: req.user._id,
    statusHistory: [{ status: 'pending', changedBy: req.user._id }],
  });

  res.status(201).json({ data: await populateOrder(Order.findById(order._id)) });
});

// PATCH /api/orders/:id/status  body: { status }
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!ORDER_STATUS.includes(status)) throw new ApiError(400, 'Trạng thái không hợp lệ');

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Không tìm thấy đơn hàng');

  if (!STATUS_FLOW[order.status].includes(status)) {
    throw new ApiError(400, `Không thể chuyển từ "${order.status}" sang "${status}"`);
  }
  // Nhân viên không được hủy đơn đã giao đi
  if (status === 'cancelled' && order.status === 'shipping' && req.user.role !== 'admin') {
    throw new ApiError(403, 'Chỉ admin được hủy đơn đang giao');
  }

  order.status = status;
  order.statusHistory.push({ status, changedBy: req.user._id });
  await order.save();

  res.json({ data: await populateOrder(Order.findById(order._id)) });
});

// DELETE /api/orders/:id  (admin) — chỉ xóa được đơn đã hủy
export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Không tìm thấy đơn hàng');
  if (order.status !== 'cancelled') throw new ApiError(400, 'Chỉ xóa được đơn đã hủy');
  await order.deleteOne();
  res.json({ message: 'Đã xóa đơn hàng' });
});

// GET /api/orders/meta/status-flow
export const getStatusFlow = (req, res) => {
  res.json({ data: { statuses: ORDER_STATUS, flow: STATUS_FLOW } });
};

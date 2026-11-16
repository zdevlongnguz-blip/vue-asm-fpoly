import Customer from '../models/Customer.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getPagination, escapeRegex } from '../utils/pagination.js';

// Giai đoạn 1: chỉ cần tìm + tạo khách để phục vụ form tạo đơn.
// Giai đoạn 2 sẽ bổ sung sửa/xóa + lịch sử mua.

// GET /api/customers?search=
export const getCustomers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: regex }, { phone: regex }];
  }
  const [data, total] = await Promise.all([
    Customer.find(filter).sort('-createdAt').skip(skip).limit(limit),
    Customer.countDocuments(filter),
  ]);
  res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

export const createCustomer = asyncHandler(async (req, res) => {
  const { name, phone, email, address } = req.body;
  const customer = await Customer.create({ name, phone, email, address });
  res.status(201).json({ data: customer });
});

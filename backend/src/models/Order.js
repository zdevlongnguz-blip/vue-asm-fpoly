import mongoose from 'mongoose';

export const ORDER_STATUS = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];

// Luồng trạng thái hợp lệ: trạng thái hiện tại -> các trạng thái được phép chuyển tới
export const STATUS_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

// Chi tiết đơn được nhúng trong đơn; lưu bản sao tên + giá tại thời điểm mua
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: [1, 'Số lượng tối thiểu là 1'] },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUS },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: {
      type: [orderItemSchema],
      validate: [(v) => v.length > 0, 'Đơn hàng phải có ít nhất 1 sản phẩm'],
    },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUS, default: 'pending' },
    note: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    statusHistory: [statusHistorySchema],
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);

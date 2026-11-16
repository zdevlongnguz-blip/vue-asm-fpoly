import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Tên khách hàng là bắt buộc'], trim: true },
    phone: { type: String, required: [true, 'Số điện thoại là bắt buộc'], unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    address: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Customer', customerSchema);

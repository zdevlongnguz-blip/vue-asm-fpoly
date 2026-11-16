import mongoose from 'mongoose';

export const PRODUCT_STATUS = ['available', 'unavailable'];

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Tên sản phẩm là bắt buộc'], trim: true },
    description: { type: String, required: [true, 'Mô tả là bắt buộc'], trim: true },
    price: { type: Number, required: [true, 'Giá là bắt buộc'], min: [0, 'Giá không được âm'] },
    image: { type: String, default: '' },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Danh mục là bắt buộc'],
    },
    status: { type: String, enum: PRODUCT_STATUS, default: 'available' },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Product', productSchema);

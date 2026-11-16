import Category from '../models/Category.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('name');
  res.json({ data: categories });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, icon } = req.body;
  const category = await Category.create({ name, icon });
  res.status(201).json({ data: category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { name, icon } = req.body;
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name, icon },
    { new: true, runValidators: true }
  );
  if (!category) throw new ApiError(404, 'Không tìm thấy danh mục');
  res.json({ data: category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const used = await Product.exists({ category: req.params.id });
  if (used) throw new ApiError(400, 'Danh mục đang có sản phẩm, không thể xóa');
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Không tìm thấy danh mục');
  res.json({ message: 'Đã xóa danh mục' });
});

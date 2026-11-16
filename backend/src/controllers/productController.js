import Product, { PRODUCT_STATUS } from '../models/Product.js';
import Category from '../models/Category.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getPagination, escapeRegex } from '../utils/pagination.js';

const SORT_FIELDS = ['name', 'price', 'createdAt'];

// GET /api/products?search=&category=&status=&sort=price&order=asc&page=1&limit=10
export const getProducts = asyncHandler(async (req, res) => {
  const { search, category, status, sort = 'createdAt', order = 'desc' } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: regex }, { description: regex }];
  }
  if (category) filter.category = category;
  if (status && PRODUCT_STATUS.includes(status)) filter.status = status;

  const sortField = SORT_FIELDS.includes(sort) ? sort : 'createdAt';
  const sortBy = { [sortField]: order === 'asc' ? 1 : -1, _id: 1 };

  const [data, total] = await Promise.all([
    Product.find(filter).populate('category', 'name icon').sort(sortBy).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name icon');
  if (!product) throw new ApiError(404, 'Không tìm thấy sản phẩm');
  res.json({ data: product });
});

const pickProductFields = ({ name, description, price, image, category, status }) => ({
  name,
  description,
  price,
  image,
  category,
  status,
});

const ensureCategory = async (id) => {
  if (id && !(await Category.exists({ _id: id }))) throw new ApiError(400, 'Danh mục không tồn tại');
};

export const createProduct = asyncHandler(async (req, res) => {
  const body = pickProductFields(req.body);
  await ensureCategory(body.category);
  const product = await Product.create(body);
  await product.populate('category', 'name icon');
  res.status(201).json({ data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const body = pickProductFields(req.body);
  await ensureCategory(body.category);
  const product = await Product.findByIdAndUpdate(req.params.id, body, {
    new: true,
    runValidators: true,
  }).populate('category', 'name icon');
  if (!product) throw new ApiError(404, 'Không tìm thấy sản phẩm');
  res.json({ data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Không tìm thấy sản phẩm');
  res.json({ message: 'Đã xóa sản phẩm' });
});

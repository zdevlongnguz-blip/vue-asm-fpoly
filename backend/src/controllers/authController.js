import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const toPublic = ({ _id, name, email, role }) => ({ _id, name, email, role });

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Vui lòng nhập email và mật khẩu');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Email hoặc mật khẩu không đúng');
  }
  if (!user.isActive) throw new ApiError(403, 'Tài khoản đã bị khóa');

  res.json({ token: signToken(user), user: toPublic(user) });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  res.json({ user: toPublic(req.user) });
});

// POST /api/auth/register  (chỉ admin tạo tài khoản nhân viên)
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const user = await User.create({ name, email, password, role });
  res.status(201).json({ user: toPublic(user) });
});

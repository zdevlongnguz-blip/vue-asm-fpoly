import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['admin', 'staff'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Tên là bắt buộc'], trim: true },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },
    password: { type: String, required: [true, 'Mật khẩu là bắt buộc'], minlength: 6, select: false },
    role: { type: String, enum: ROLES, default: 'staff' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('User', userSchema);

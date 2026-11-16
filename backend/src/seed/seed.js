import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';

const categoriesData = [
  { name: 'Pastas', icon: '🍝' },
  { name: 'Salads', icon: '🥗' },
  { name: 'Starters', icon: '🍟' },
  { name: 'Desserts', icon: '🍰' },
  { name: 'Cold Drinks', icon: '🥤' },
  { name: 'Hot Drinks', icon: '☕' },
];

const productsData = [
  ['Spaghetti Carbonara', 'Classic Italian pasta with a creamy sauce made from eggs, pecorino and pancetta.', 14, 'Pastas'],
  ['Cannelloni', 'Large pasta tubes filled with meat or cheese, covered in sauce and baked.', 15.5, 'Pastas'],
  ['Lasagna', 'Layers of pasta, beef ragù, béchamel and parmesan.', 16, 'Pastas'],
  ['Penne Arrabbiata', 'Penne in a spicy tomato and garlic sauce.', 12, 'Pastas'],
  ['Cobb Salad', 'A hearty option with mixed greens, chicken, bacon, eggs and avocado.', 12, 'Salads'],
  ['Nicoise Salad', 'Tuna, green beans, potatoes, eggs, olives and tomatoes over greens.', 13, 'Salads'],
  ['Caesar Salad', 'Romaine, croutons, parmesan and Caesar dressing.', 10, 'Salads'],
  ['Edamame', 'Steamed young soybeans sprinkled with sea salt.', 5, 'Starters'],
  ['Garlic Bread', 'Toasted bread with garlic butter and herbs.', 4.5, 'Starters'],
  ['French Fries', 'Crispy golden fries with ketchup.', 4, 'Starters'],
  ['Apple Pie', 'Classic apple pie with a flaky crust and cinnamon-spiced filling.', 6, 'Desserts'],
  ['Ice Cream', 'Your choice of vanilla, chocolate, or strawberry ice cream.', 4, 'Desserts'],
  ['Tiramisu', 'Coffee-soaked ladyfingers layered with mascarpone cream.', 7, 'Desserts'],
  ['Coke', 'Classic Coca-Cola served chilled.', 2, 'Cold Drinks'],
  ['Sprite', 'Crisp and refreshing lemon-lime Sprite.', 2, 'Cold Drinks'],
  ['Iced Lemon Tea', 'Black tea with fresh lemon over ice.', 3, 'Cold Drinks'],
  ['Coffee', 'Freshly brewed coffee, rich and aromatic.', 3, 'Hot Drinks'],
  ['Cappuccino', 'Espresso with steamed milk foam.', 4, 'Hot Drinks'],
  ['Green Tea', 'Hot Japanese green tea.', 2.5, 'Hot Drinks'],
];

const customersData = [
  { name: 'Nguyễn Văn An', phone: '0901000001', address: '12 Lê Lợi, Q.1, TP.HCM', email: 'an@example.com' },
  { name: 'Trần Thị Bình', phone: '0901000002', address: '45 Trần Hưng Đạo, Q.5, TP.HCM' },
  { name: 'Lê Hoàng Cường', phone: '0901000003', address: '8 Nguyễn Trãi, Thanh Xuân, Hà Nội' },
  { name: 'Phạm Minh Dung', phone: '0901000004', address: '102 Hùng Vương, Hải Châu, Đà Nẵng' },
  { name: 'Võ Thị Em', phone: '0901000005', address: '23 Võ Văn Tần, Q.3, TP.HCM' },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seed = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany(),
    Category.deleteMany(),
    Product.deleteMany(),
    Customer.deleteMany(),
    Order.deleteMany(),
  ]);

  // create() thay vì insertMany() để chạy hook hash mật khẩu
  const admin = await User.create({ name: 'Admin', email: 'admin@shop.com', password: '123456', role: 'admin' });
  const staff = await User.create({ name: 'Nhân viên A', email: 'staff@shop.com', password: '123456', role: 'staff' });

  const categories = await Category.insertMany(categoriesData);
  const catByName = Object.fromEntries(categories.map((c) => [c.name, c._id]));

  const products = await Product.insertMany(
    productsData.map(([name, description, price, cat], i) => ({
      name,
      description,
      price,
      category: catByName[cat],
      status: i % 5 === 4 ? 'unavailable' : 'available',
      image: `https://picsum.photos/seed/${encodeURIComponent(name)}/200`,
    }))
  );
  const available = products.filter((p) => p.status === 'available');

  const customers = await Customer.insertMany(customersData);

  // 30 đơn rải trong 14 ngày gần nhất
  const statuses = ['pending', 'confirmed', 'shipping', 'completed', 'completed', 'completed', 'cancelled'];
  const orders = [];
  for (let i = 0; i < 30; i += 1) {
    const chosen = [...available].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3));
    const items = chosen.map((p) => ({ product: p._id, name: p.name, price: p.price, quantity: 1 + Math.floor(Math.random() * 3) }));
    const createdAt = new Date(Date.now() - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000));
    const status = pick(statuses);
    const by = pick([admin, staff]);
    orders.push({
      code: `#${100000 + i * 7919}`,
      customer: pick(customers)._id,
      items,
      total: items.reduce((s, it) => s + it.price * it.quantity, 0),
      status,
      createdBy: by._id,
      statusHistory: [{ status, changedBy: by._id, changedAt: createdAt }],
      createdAt,
      updatedAt: createdAt,
    });
  }
  await Order.insertMany(orders, { timestamps: false });

  console.log('Seed xong:');
  console.log(`  ${categories.length} danh mục, ${products.length} sản phẩm, ${customers.length} khách, ${orders.length} đơn`);
  console.log('  admin@shop.com / 123456  (admin)');
  console.log('  staff@shop.com / 123456  (nhân viên)');
  await mongoose.disconnect();
};

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});

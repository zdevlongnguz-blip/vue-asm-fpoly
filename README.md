# Sales Manager – WEB207 Assignment (Giai đoạn 1)

Ứng dụng quản lý bán hàng: **Vue 3** (frontend) + **Express.js REST API** (backend) + **MongoDB**.
Toàn bộ code dùng ES Module (`"type": "module"`, `import/export`).

```
sales-app/
├── backend/    Express + Mongoose + JWT
└── frontend/   Vue 3 + Vite + Vue Router + Pinia + Axios + Bootstrap 5
```

## Yêu cầu
- Node.js ≥ 20
- MongoDB đang chạy ở `mongodb://127.0.0.1:27017` (hoặc MongoDB Atlas, sửa `MONGODB_URI` trong `backend/.env`)

## Chạy dự án

Mọi lệnh dưới đây chạy ở **thư mục gốc** `sales-app/`.

| Lệnh | Tác dụng |
|---|---|
| `npm run install:all` | Cài package cho gốc + backend + frontend (chạy 1 lần đầu) |
| `npm run seed` | Tạo dữ liệu mẫu (**XÓA** dữ liệu cũ trong DB `sales_management`) |
| `npm run dev` | Chạy **cả 2 server** trong 1 terminal: BE `:3000` + FE `:5173` |
| `npm run dev:be` | Chỉ chạy backend (nodemon, tự reload) |
| `npm run dev:fe` | Chỉ chạy frontend (Vite) |
| `npm run build` | Build frontend ra `frontend/dist` |
| `npm start` | Chạy bản production: backend phục vụ luôn `frontend/dist`, chỉ 1 server `:3000` |
| `npm run prod` | `build` + `start` |
| `npm run pack -- PH12345` | Đóng gói zip nộp LMS → `../WEB207_PH12345_Assignment.zip` (bỏ `node_modules`, `dist`; tự kèm `BaoCao.doc(x)` nếu đặt cạnh thư mục `sales-app`) |

Lần đầu:
```bash
npm run install:all
npm run seed
npm run dev
```
Mở http://localhost:5173 (dev) hoặc http://localhost:3000 (sau `npm run prod`).

Vẫn có thể chạy riêng trong từng thư mục:
```bash
cd backend  && npm install && npm run dev     # npm start = chạy không reload
cd frontend && npm install && npm run dev     # npm run build / npm run preview
```

**Tài khoản demo** (bấm nhanh ở trang đăng nhập):

| Email | Mật khẩu | Vai trò |
|---|---|---|
| admin@shop.com | 123456 | Admin |
| staff@shop.com | 123456 | Nhân viên bán hàng |

## Phân quyền

| Chức năng | Admin | Nhân viên |
|---|:-:|:-:|
| Xem sản phẩm | ✅ | ✅ |
| Thêm / sửa / xóa sản phẩm | ✅ | ❌ |
| Xem, tạo đơn hàng | ✅ | ✅ |
| Cập nhật trạng thái đơn | ✅ | ✅ |
| Hủy đơn đang giao | ✅ | ❌ |
| Xóa đơn (đã hủy) | ✅ | ❌ |
| Tạo tài khoản nhân viên (API) | ✅ | ❌ |

Phân quyền được kiểm tra ở **cả hai phía**: backend (middleware `protect` + `authorize`) và frontend (route guard + ẩn nút).

## Luồng trạng thái đơn hàng
```
pending ─► confirmed ─► shipping ─► completed
   │           │            │
   └───────────┴────────────┴─► cancelled
```

## REST API (`/api`)

Mọi route (trừ login) cần header `Authorization: Bearer <token>`.

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| POST | `/auth/login` | public | Đăng nhập, trả về token |
| GET | `/auth/me` | đăng nhập | Thông tin user hiện tại |
| POST | `/auth/register` | admin | Tạo tài khoản |
| GET | `/categories` | đăng nhập | Danh sách danh mục |
| POST/PUT/DELETE | `/categories[/:id]` | admin | Quản lý danh mục |
| GET | `/products` | đăng nhập | `?search=&category=&status=&sort=price&order=asc&page=1&limit=10` |
| GET | `/products/:id` | đăng nhập | Chi tiết |
| POST | `/products` | admin | Thêm |
| PUT | `/products/:id` | admin | Sửa |
| DELETE | `/products/:id` | admin | Xóa |
| GET | `/customers` | đăng nhập | `?search=` (tên/SĐT) |
| POST | `/customers` | đăng nhập | Thêm khách |
| GET | `/orders` | đăng nhập | `?search=&status=&from=&to=&page=&limit=` |
| GET | `/orders/:id` | đăng nhập | Chi tiết đơn |
| POST | `/orders` | đăng nhập | Tạo đơn (giá tính lại ở server) |
| PATCH | `/orders/:id/status` | đăng nhập | Đổi trạng thái theo luồng hợp lệ |
| DELETE | `/orders/:id` | admin | Xóa đơn đã hủy |

Ví dụ body tạo đơn:
```json
{
  "customerId": "665f...",
  "items": [{ "product": "665a...", "quantity": 2 }],
  "note": "Giao giờ hành chính"
}
```
Hoặc khách mới: thay `customerId` bằng `"customer": { "name": "...", "phone": "09..." }`.

## Database (MongoDB)
- `users`: name, email, password (bcrypt), role (`admin` | `staff`)
- `categories`: name, icon
- `products`: name, description, price, image, category → categories, status
- `customers`: name, phone (unique), email, address
- `orders`: code, customer → customers, **items[] nhúng** (product, name, price, quantity), total, status, note, createdBy → users, statusHistory[]

`items` lưu bản sao tên và giá tại thời điểm mua, nên đổi giá sản phẩm không làm sai đơn cũ.

## Giai đoạn 2 (chưa làm)
- Module khách hàng đầy đủ (sửa/xóa, lịch sử mua)
- Module thống kê (biểu đồ doanh thu, top sản phẩm)
- Upload ảnh, quản lý nhân viên, báo cáo `BaoCao.doc`

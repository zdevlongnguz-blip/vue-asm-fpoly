export const formatMoney = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);

export const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
    : '';

export const ORDER_STATUS = {
  pending: { label: 'Chờ xác nhận', color: 'warning', icon: 'bi-hourglass-split' },
  confirmed: { label: 'Đã xác nhận', color: 'info', icon: 'bi-check2-circle' },
  shipping: { label: 'Đang giao', color: 'primary', icon: 'bi-truck' },
  completed: { label: 'Hoàn thành', color: 'success', icon: 'bi-bag-check' },
  cancelled: { label: 'Đã hủy', color: 'secondary', icon: 'bi-x-circle' },
};

// Phải khớp với STATUS_FLOW ở backend
export const STATUS_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

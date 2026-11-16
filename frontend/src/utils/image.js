// Ảnh lỗi/không tải được -> hiện ô xám thay vì icon ảnh vỡ
const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E';

export const onImgError = (e) => {
  if (e.target.src !== PLACEHOLDER) e.target.src = PLACEHOLDER;
};

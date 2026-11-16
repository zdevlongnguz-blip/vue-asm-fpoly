export const notFound = (req, res) => {
  res.status(404).json({ message: `Không tìm thấy ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Lỗi máy chủ';
  let errors;

  if (err.name === 'ValidationError') {
    status = 400;
    errors = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    message = Object.values(errors)[0];
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Giá trị không hợp lệ cho trường ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field} "${err.keyValue?.[field]}" đã tồn tại`;
  }

  if (status === 500) console.error(err);
  res.status(status).json({ message, ...(errors && { errors }) });
};

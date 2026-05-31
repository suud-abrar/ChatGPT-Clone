export const errorHandler = (err, req, res, next) => {
  return res.status(err.status || 500).json({
    status: false,
    message: err.message || "something went wrong try again later",
  });
};

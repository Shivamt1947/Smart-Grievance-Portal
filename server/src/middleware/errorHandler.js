import { ZodError } from 'zod';

export const notFound = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'An unexpected internal server error occurred.';

  // Handle Zod schema validation errors
  if (err instanceof ZodError) {
    statusCode = 422;
    message = 'Validation failed';
    const validationErrors = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    return res.status(statusCode).json({
      success: false,
      message,
      errors: validationErrors,
    });
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered: ${field}. Please use another value.`;
  }

  // Handle Mongoose Bad ObjectId / CastError
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with specified identifier.`;
  }

  console.error(`[Error ${statusCode}] ${req.method} ${req.originalUrl}:`, err.message);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

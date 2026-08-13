export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  })
}

export const errorResponse = (res, message = 'Error', errors = [], statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  })
}

export const paginatedResponse = (res, items, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data: {
      items,
      pagination
    }
  })
}

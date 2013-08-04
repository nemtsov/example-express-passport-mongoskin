var createError  = require('errno').custom.createError
  , AppError = createError('AppError')

module.exports = {
    AppError: AppError
  , ConflictError: createError('ConflictError', AppError)
}

const { body, validationResult } = require('express-validator');

const handleErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

exports.validateRegister = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name too short'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password min 8 chars')
    .matches(/\d/).withMessage('Password needs a number')
    .matches(/[A-Z]/).withMessage('Password needs uppercase'),
  handleErrors
];

exports.validateLogin = [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password required'),
  handleErrors
];

exports.validateGig = [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('description').trim().notEmpty().withMessage('Description required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('category')
    .isIn(['Design', 'Development', 'Writing', 'Marketing', 'Other'])
    .withMessage('Invalid category'),
  handleErrors
];
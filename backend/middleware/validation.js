const { body, validationResult } = require('express-validator');

const COMMON_PASSWORDS = [
  'password', 'password1', 'password123', 'password1!', 'qwerty123', 'qwerty123!',
  '12345678', '123456789', 'letmein1', 'welcome1', 'welcome123', 'admin123',
  'admin1234', 'iloveyou1', 'abc12345', 'hustlehub1', 'hustlehub123',
];

const handleErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

exports.validateRegister = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name too short'),
  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password min 8 chars')
    .matches(/\d/).withMessage('Password needs a number')
    .matches(/[A-Z]/).withMessage('Password needs uppercase')
    .matches(/[a-z]/).withMessage('Password needs lowercase')
    .matches(/[^A-Za-z0-9]/).withMessage('Password needs a special character')
    .custom((value) => !COMMON_PASSWORDS.includes(String(value).toLowerCase()))
    .withMessage('Password is too common'),
  handleErrors
];

exports.validateLogin = [
  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
  handleErrors
];

exports.COMMON_PASSWORDS = COMMON_PASSWORDS;

exports.validateGig = [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('description').trim().notEmpty().withMessage('Description required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('category')
    .isIn(['Design', 'Development', 'Writing', 'Marketing', 'Other'])
    .withMessage('Invalid category'),
  handleErrors
];
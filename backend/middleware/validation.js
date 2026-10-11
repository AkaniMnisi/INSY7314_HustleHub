const { body, validationResult } = require('express-validator');

const handleErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateRegister = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name too short'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password min 8 chars')
    .matches(/\d/).withMessage('Password needs a number')
    .matches(/[A-Z]/).withMessage('Password needs uppercase'),
  handleErrors
];

const validateLogin = [
  body('email').isEmail(),
  body('password').notEmpty(),
  handleErrors
];

const validateGig = [
  body('title').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('category').isIn(['Design', 'Development', 'Writing', 'Marketing', 'Other']),
  handleErrors
];

module.exports = { validateRegister, validateLogin, validateGig };
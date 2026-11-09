module.exports = {
  ...require('./jest.config'),
  setupFilesAfterEnv: ['<rootDir>/tests/unit.setup.js'],
  collectCoverage: false,
};

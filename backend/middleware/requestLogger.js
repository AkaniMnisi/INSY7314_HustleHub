const crypto = require('crypto');
const logger = require('../utils/logger');

const SAFE_ID = /^[A-Za-z0-9-]{8,64}$/;

/**
 * Logs one line per HTTP request: method, path, status, time, IP, user.
 * Adds an X-Request-Id header so a log line can be matched to a response.
 */
module.exports = (req, res, next) => {
  const incoming = req.headers['x-request-id'];
  req.id = SAFE_ID.test(incoming || '') ? incoming : crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);

  if (req.path === '/api/health') return next(); // Docker health checks are noise

  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger.log(level, 'http_request', {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      durationMs: Math.round(ms),
      ip: req.ip,
      userId: req.user?.id,
    });
  });
  next();
};

/** Winston structured audit logging, with optional Better Stack cloud transport. */
const winston = require('winston');
const SENSITIVE = /^(password|token|refresh.?token|access.?token|authorization|cookie|set-cookie|jwt|secret|api.?key|mongo_uri)$/i;

function redactValue(value, depth = 0) {
  if (depth > 6 || value == null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((entry) => redactValue(entry, depth + 1));
  for (const key of Object.keys(value)) {
    value[key] = SENSITIVE.test(key) ? '[REDACTED]' : redactValue(value[key], depth + 1);
  }
  return value;
}
const redact = winston.format((info) => redactValue(info));

function maskEmail(email) {
  if (typeof email !== 'string' || !email.includes('@')) return 'unknown';
  const [local, domain] = email.split('@');
  return `${local.slice(0, 1)}***@${domain}`;
}

const isTest = process.env.NODE_ENV === 'test';
const transports = [new winston.transports.Console({
  silent: isTest && process.env.LOG_IN_TESTS !== 'true',
  format: winston.format.json(),
})];

const token = process.env.LOGTAIL_SOURCE_TOKEN;
const ingest = process.env.LOGTAIL_INGESTING_HOST;
if (token && ingest && !isTest) {
  try {
    const { Logtail } = require('@logtail/node');
    const { LogtailTransport } = require('@logtail/winston');
    const host = ingest.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    const logtail = new Logtail(token, { endpoint: `https://${host}` });
    transports.push(new LogtailTransport(logtail));
  } catch (err) {
    console.error('Cloud logging unavailable:', err.message);
  }
} else if ((token || ingest) && !isTest) {
  console.error('Cloud logging requires both LOGTAIL_SOURCE_TOKEN and LOGTAIL_INGESTING_HOST.');
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'hustlehub-api' },
  format: winston.format.combine(redact(), winston.format.timestamp(), winston.format.json()),
  transports,
});
logger.maskEmail = maskEmail;
module.exports = logger;

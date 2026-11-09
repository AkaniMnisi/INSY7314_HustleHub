/**
 * Account lockout helpers (extra security feature 1).
 *
 * After MAX failed logins the account is locked for LOCK minutes.
 * This stops slow, distributed password guessing that IP rate limits miss.
 * The functions are pure so they are easy to unit test.
 */

const maxAttempts = () => Number(process.env.LOCKOUT_MAX_ATTEMPTS) || 5;
const lockMs = () => (Number(process.env.LOCKOUT_MINUTES) || 15) * 60 * 1000;

function isLocked(user, now = Date.now()) {
  return Boolean(user && user.lockUntil && new Date(user.lockUntil).getTime() > now);
}

/** Returns the fields to $set after a failed login. */
function onFailure(user, now = Date.now()) {
  const lockExpired =
    user.lockUntil && new Date(user.lockUntil).getTime() <= now;
  const attempts = (lockExpired ? 0 : user.failedLoginAttempts || 0) + 1;

  if (attempts >= maxAttempts()) {
    return {
      failedLoginAttempts: 0,
      lockUntil: new Date(now + lockMs()),
      justLocked: true,
    };
  }
  return { failedLoginAttempts: attempts, lockUntil: null, justLocked: false };
}

/** Fields to $set after a successful login. */
function onSuccess() {
  return { failedLoginAttempts: 0, lockUntil: null };
}

module.exports = { isLocked, onFailure, onSuccess, maxAttempts, lockMs };

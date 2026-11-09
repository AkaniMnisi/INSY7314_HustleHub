const { isLocked, onFailure, onSuccess } = require('../utils/lockout');

describe('Account lockout rules', () => {
  const now = Date.now();

  it('counts failures without locking before the limit', () => {
    let user = { failedLoginAttempts: 0, lockUntil: null };
    for (let i = 1; i <= 4; i++) {
      const r = onFailure(user, now);
      expect(r.justLocked).toBe(false);
      expect(r.failedLoginAttempts).toBe(i);
      user = r;
    }
  });

  it('locks the account on the 5th failure', () => {
    const r = onFailure({ failedLoginAttempts: 4, lockUntil: null }, now);
    expect(r.justLocked).toBe(true);
    expect(r.lockUntil.getTime()).toBeGreaterThan(now);
    expect(isLocked(r, now)).toBe(true);
  });

  it('unlocks after the lock time passes', () => {
    const locked = { lockUntil: new Date(now + 15 * 60 * 1000) };
    expect(isLocked(locked, now)).toBe(true);
    expect(isLocked(locked, now + 16 * 60 * 1000)).toBe(false);
  });

  it('restarts the count after an expired lock', () => {
    const user = { failedLoginAttempts: 0, lockUntil: new Date(now - 1000) };
    expect(onFailure(user, now).failedLoginAttempts).toBe(1);
  });

  it('clears state after a successful login', () => {
    expect(onSuccess()).toEqual({ failedLoginAttempts: 0, lockUntil: null });
  });

  it('treats a missing user as not locked', () => {
    expect(isLocked(null)).toBe(false);
  });
});

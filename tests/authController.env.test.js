/**
 * Tests for env variable configuration introduced in PR:
 *   MAIL_HOST = process.env.MAIL_HOST || 'smtp.gmail.com'
 *   MAIL_USER = process.env.MAIL_USER || process.env.MAlL_USER || process.env.EMAIL_USER
 *   MAIL_PASS = process.env.MAIL_PASS || process.env.MAlL_PASS || process.env.EMAIL_PASS
 *
 * These module-level constants are tested by capturing the arguments passed to
 * nodemailer.createTransport when the module is freshly loaded.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/**
 * Saves the current values of the given env keys, clears them all, then
 * returns a restore function that puts the original values back.
 */
function isolateEnv(overrides = {}) {
  const KEYS = [
    'MAIL_HOST',
    'MAIL_USER',
    // intentional typo variants used as fallbacks
    'MAlL_USER',
    'EMAIL_USER',
    'MAIL_PASS',
    'MAlL_PASS',
    'EMAIL_PASS',
    // dotenv may set these; capture them too
    'JWT_SECRET',
  ];

  const saved = {};
  KEYS.forEach((k) => {
    saved[k] = process.env[k];
    delete process.env[k];
  });

  Object.assign(process.env, overrides);

  return function restore() {
    KEYS.forEach((k) => {
      if (saved[k] === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = saved[k];
      }
    });
  };
}

/**
 * Resets the module registry, sets env to `overrides`, dynamically imports
 * authController, and returns the createTransport spy call arguments.
 *
 * Mocks applied before import:
 *   - dotenv/config   → no-op (prevents .env file from overwriting test env)
 *   - mongoose        → stub model so User import succeeds
 *   - nodemailer      → spy on createTransport; sendMail resolves
 */
async function loadWithEnv(overrides = {}) {
  vi.resetModules();

  const createTransportSpy = vi.fn(() => ({ sendMail: vi.fn().mockResolvedValue({}) }));

  vi.doMock('dotenv/config', () => ({}));
  vi.doMock('nodemailer', () => ({
    default: { createTransport: createTransportSpy },
  }));
  vi.doMock('bcryptjs', () => ({
    default: {
      hash: vi.fn().mockResolvedValue('hashed'),
      compare: vi.fn().mockResolvedValue(true),
    },
  }));
  vi.doMock('jsonwebtoken', () => ({
    default: { sign: vi.fn().mockReturnValue('token') },
  }));
  vi.doMock('../models/User.js', () => ({
    default: {
      findOne: vi.fn(),
      prototype: { save: vi.fn() },
    },
  }));

  const restore = isolateEnv(overrides);

  // Dynamic import picks up the freshly mocked modules and current env vars.
  await import('../controllers/authController.js');

  restore();

  return createTransportSpy;
}

// --------------------------------------------------------------------------
// MAIL_HOST tests
// --------------------------------------------------------------------------

describe('MAIL_HOST env variable resolution', () => {
  it('defaults to smtp.gmail.com when MAIL_HOST is not set', async () => {
    const spy = await loadWithEnv({});
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toMatchObject({ host: 'smtp.gmail.com' });
  });

  it('uses the value of MAIL_HOST when it is set', async () => {
    const spy = await loadWithEnv({ MAIL_HOST: 'mail.example.com' });
    expect(spy.mock.calls[0][0]).toMatchObject({ host: 'mail.example.com' });
  });

  it('uses MAIL_HOST even when set to an empty string (falsy → falls back to default)', async () => {
    // An empty string is falsy so the || short-circuit picks the default.
    const spy = await loadWithEnv({ MAIL_HOST: '' });
    expect(spy.mock.calls[0][0]).toMatchObject({ host: 'smtp.gmail.com' });
  });
});

// --------------------------------------------------------------------------
// MAIL_USER tests
// --------------------------------------------------------------------------

describe('MAIL_USER env variable resolution (primary → typo-fallback → alias)', () => {
  it('uses MAIL_USER when it is set', async () => {
    const spy = await loadWithEnv({ MAIL_USER: 'user@primary.com' });
    expect(spy.mock.calls[0][0].auth).toMatchObject({ user: 'user@primary.com' });
  });

  it('falls back to MAlL_USER (capital-I typo) when MAIL_USER is not set', async () => {
    const spy = await loadWithEnv({ MAlL_USER: 'user@typo.com' });
    expect(spy.mock.calls[0][0].auth).toMatchObject({ user: 'user@typo.com' });
  });

  it('falls back to EMAIL_USER when neither MAIL_USER nor MAlL_USER is set', async () => {
    const spy = await loadWithEnv({ EMAIL_USER: 'user@alias.com' });
    expect(spy.mock.calls[0][0].auth).toMatchObject({ user: 'user@alias.com' });
  });

  it('is undefined when none of the user env vars are set', async () => {
    const spy = await loadWithEnv({});
    expect(spy.mock.calls[0][0].auth.user).toBeUndefined();
  });

  it('prefers MAIL_USER over MAlL_USER when both are set', async () => {
    const spy = await loadWithEnv({
      MAIL_USER: 'user@primary.com',
      MAlL_USER: 'user@typo.com',
    });
    expect(spy.mock.calls[0][0].auth).toMatchObject({ user: 'user@primary.com' });
  });

  it('prefers MAlL_USER over EMAIL_USER when MAIL_USER is absent', async () => {
    const spy = await loadWithEnv({
      MAlL_USER: 'user@typo.com',
      EMAIL_USER: 'user@alias.com',
    });
    expect(spy.mock.calls[0][0].auth).toMatchObject({ user: 'user@typo.com' });
  });
});

// --------------------------------------------------------------------------
// MAIL_PASS tests
// --------------------------------------------------------------------------

describe('MAIL_PASS env variable resolution (primary → typo-fallback → alias)', () => {
  it('uses MAIL_PASS when it is set', async () => {
    const spy = await loadWithEnv({ MAIL_PASS: 'secret123' });
    expect(spy.mock.calls[0][0].auth).toMatchObject({ pass: 'secret123' });
  });

  it('falls back to MAlL_PASS (capital-I typo) when MAIL_PASS is not set', async () => {
    const spy = await loadWithEnv({ MAlL_PASS: 'typopwd' });
    expect(spy.mock.calls[0][0].auth).toMatchObject({ pass: 'typopwd' });
  });

  it('falls back to EMAIL_PASS when neither MAIL_PASS nor MAlL_PASS is set', async () => {
    const spy = await loadWithEnv({ EMAIL_PASS: 'aliaspwd' });
    expect(spy.mock.calls[0][0].auth).toMatchObject({ pass: 'aliaspwd' });
  });

  it('is empty string when none of the pass env vars are set (MAIL_PASS_CLEAN strips falsy)', async () => {
    const spy = await loadWithEnv({});
    // MAIL_PASS_CLEAN = (undefined || '').replace(/\s+/g, '') === ''
    expect(spy.mock.calls[0][0].auth.pass).toBe('');
  });

  it('prefers MAIL_PASS over MAlL_PASS when both are set', async () => {
    const spy = await loadWithEnv({
      MAIL_PASS: 'primary_pass',
      MAlL_PASS: 'typo_pass',
    });
    expect(spy.mock.calls[0][0].auth).toMatchObject({ pass: 'primary_pass' });
  });

  it('prefers MAlL_PASS over EMAIL_PASS when MAIL_PASS is absent', async () => {
    const spy = await loadWithEnv({
      MAlL_PASS: 'typo_pass',
      EMAIL_PASS: 'alias_pass',
    });
    expect(spy.mock.calls[0][0].auth).toMatchObject({ pass: 'typo_pass' });
  });
});

// --------------------------------------------------------------------------
// MAIL_PASS_CLEAN whitespace stripping (adjacent behaviour, not in diff but
// exercised together with the changed constants)
// --------------------------------------------------------------------------

describe('MAIL_PASS_CLEAN whitespace stripping', () => {
  it('strips leading and trailing spaces from MAIL_PASS', async () => {
    const spy = await loadWithEnv({ MAIL_PASS: '  spaced_pass  ' });
    expect(spy.mock.calls[0][0].auth.pass).toBe('spaced_pass');
  });

  it('strips internal whitespace from MAIL_PASS', async () => {
    const spy = await loadWithEnv({ MAIL_PASS: 'pass word' });
    expect(spy.mock.calls[0][0].auth.pass).toBe('password');
  });

  it('strips whitespace from fallback MAlL_PASS', async () => {
    const spy = await loadWithEnv({ MAlL_PASS: ' typo pwd ' });
    expect(spy.mock.calls[0][0].auth.pass).toBe('typopwd');
  });
});

// --------------------------------------------------------------------------
// Transporter static options (port / secure) are unaffected by the env changes
// --------------------------------------------------------------------------

describe('nodemailer.createTransport static options', () => {
  it('always uses port 587', async () => {
    const spy = await loadWithEnv({});
    expect(spy.mock.calls[0][0]).toMatchObject({ port: 587 });
  });

  it('always sets secure: false', async () => {
    const spy = await loadWithEnv({});
    expect(spy.mock.calls[0][0]).toMatchObject({ secure: false });
  });
});

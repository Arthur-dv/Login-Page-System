import { createHmac, timingSafeEqual } from 'node:crypto';
import type { TokenPayload } from '../types.ts';

const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');

function sign(value: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(value).digest();
}

export function createToken(userId: string, secret: string): string {
  const payload: TokenPayload = { sub: userId, exp: Math.floor(Date.now() / 1000) + 7 * 86400 };
  const body = `${header}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}`;
  return `${body}.${sign(body, secret).toString('base64url')}`;
}

export function verifyToken(token: string, secret: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part))) return null;
  const [encodedHeader, encodedPayload, signature] = parts;
  if (encodedHeader !== header) return null;
  const expected = sign(`${encodedHeader}.${encodedPayload}`, secret);
  const received = Buffer.from(signature, 'base64url');
  if (received.toString('base64url') !== signature || received.length !== expected.length) return null;
  if (!timingSafeEqual(received, expected)) return null;
  try {
    const payload: unknown = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (typeof payload !== 'object' || payload === null) return null;
    if (!('sub' in payload) || typeof payload.sub !== 'string' || !payload.sub) return null;
    if (!('exp' in payload) || typeof payload.exp !== 'number' || !Number.isSafeInteger(payload.exp)) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return { sub: payload.sub, exp: payload.exp };
  } catch {
    return null;
  }
}

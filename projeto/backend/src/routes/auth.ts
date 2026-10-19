import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { publicUser } from '../types.ts';
import { findUser, insertUser } from '../lib/db.ts';
import { hashPassword, verifyPassword } from '../lib/password.ts';
import { createToken, verifyToken } from '../lib/token.ts';
import { HttpError, json, readJson } from '../lib/http.ts';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Mesmo custo de derivação quando o e-mail não existe.
const dummyPassword = await hashPassword(randomUUID());

export async function register(request: IncomingMessage, response: ServerResponse) {
  const body = await readJson(request);
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!name || name.length > 80) throw new HttpError(400, 'Informe um nome de até 80 caracteres');
  if (!emailPattern.test(email)) throw new HttpError(400, 'Informe um e-mail válido');
  if (typeof body.password !== 'string' || body.password.length < 8) {
    throw new HttpError(400, 'A senha deve ter pelo menos 8 caracteres');
  }
  const password = await hashPassword(body.password);
  const user = { id: randomUUID(), name, email, ...password };
  await insertUser(user);
  json(response, 201, publicUser(user));
}

export async function login(request: IncomingMessage, response: ServerResponse, secret: string) {
  const body = await readJson(request);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || typeof body.password !== 'string' || !body.password) {
    throw new HttpError(400, 'Informe o e-mail e a senha');
  }
  const user = await findUser('email', email);
  const credentials = user ?? dummyPassword;
  const valid = await verifyPassword(body.password, credentials.salt, credentials.hash);
  if (!user || !valid) throw new HttpError(401, 'E-mail ou senha inválidos');
  json(response, 200, { token: createToken(user.id, secret), user: publicUser(user) });
}

export async function me(request: IncomingMessage, response: ServerResponse, secret: string) {
  const match = request.headers.authorization?.match(/^Bearer ([A-Za-z0-9_.-]+)$/);
  const payload = match ? verifyToken(match[1], secret) : null;
  if (!payload) throw new HttpError(401, 'Sessão inválida ou expirada. Entre novamente.');
  const user = await findUser('id', payload.sub);
  if (!user) throw new HttpError(404, 'Usuário não encontrado');
  json(response, 200, publicUser(user));
}

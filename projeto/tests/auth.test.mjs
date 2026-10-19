import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { hashPassword, verifyPassword } from '../backend/src/lib/password.ts';
import { createToken, verifyToken } from '../backend/src/lib/token.ts';
import { validateRegister, validateLogin } from '../frontend/src/validation.ts';

const secret = 'segredo-exclusivo-dos-testes';

test('scrypt: salts únicos, verificação e rejeição de senha incorreta', async () => {
  const a = await hashPassword('Senha123!');
  const b = await hashPassword('Senha123!');
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.hash, b.hash);
  assert.equal(await verifyPassword('Senha123!', a.salt, a.hash), true);
  assert.equal(await verifyPassword('senha-errada', a.salt, a.hash), false);
});

test('tokens: validade, adulteração, expiração e algoritmo', () => {
  const token = createToken('user-1', secret);
  assert.equal(verifyToken(token, secret)?.sub, 'user-1');
  assert.equal(verifyToken(token, 'outro-segredo'), null);
  assert.equal(verifyToken(`${token}x`, secret), null);
  assert.equal(verifyToken('x.y.z', secret), null);
  const [header] = token.split('.');
  const expired = `${header}.${Buffer.from(JSON.stringify({ sub: 'user-1', exp: 1 })).toString('base64url')}`;
  const signature = createHmac('sha256', secret).update(expired).digest('base64url');
  assert.equal(verifyToken(`${expired}.${signature}`, secret), null);
});

test('validação do frontend: obrigatórios, e-mail, tamanho e confirmação', () => {
  assert.equal(Object.keys(validateLogin({ email: '', password: '' })).length, 2);
  assert.ok(validateLogin({ email: 'inválido', password: '12345678' }).email);
  assert.ok(validateLogin({ email: 'a@b.com', password: 'curta' }).password);
  assert.deepEqual(validateRegister({ name: ' Ana ', email: 'a@b.com', password: '12345678' }, '12345678'), {});
  assert.ok(validateRegister({ name: 'x'.repeat(81), email: 'a@b.com', password: '12345678' }, 'diferente').name);
  assert.ok(validateRegister({ name: 'Ana', email: 'a@b.com', password: '12345678' }, 'diferente').confirmPassword);
});

test('integração HTTP com banco temporário isolado', async t => {
  const temporary = await mkdtemp(join(tmpdir(), 'refugio-test-'));
  await cp(new URL('../backend/src/', import.meta.url), join(temporary, 'src'), { recursive: true });
  await cp(new URL('../backend/package.json', import.meta.url), join(temporary, 'package.json'));
  const portProbe = createServer();
  portProbe.listen(0, 'localhost');
  await once(portProbe, 'listening');
  const address = portProbe.address();
  assert.ok(address && typeof address === 'object');
  const port = address.port;
  await new Promise(resolve => portProbe.close(resolve));
  const child = spawn(process.execPath, ['src/server.ts'], {
    cwd: temporary, env: { ...process.env, PORT: String(port), TOKEN_SECRET: secret }, stdio: ['ignore', 'ignore', 'pipe'],
  });
  let serverErrors = '';
  child.stderr.on('data', chunk => { serverErrors += chunk.toString(); });
  t.after(async () => {
    const ended = once(child, 'exit');
    child.kill();
    await ended;
    await rm(temporary, { recursive: true, force: true });
  });
  const base = `http://localhost:${port}/api`;
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { await fetch(base); ready = true; break; }
    catch { await new Promise(resolve => setTimeout(resolve, 50)); }
  }
  assert.ok(ready, serverErrors);
  async function request(path, body, token) {
    const response = await fetch(`${base}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, data: await response.json() };
  }
  const credentials = { name: ' Ana ', email: ' ANA@EXAMPLE.COM ', password: 'Senha123!' };
  const registered = await request('/auth/register', credentials);
  assert.equal(registered.status, 201);
  assert.equal(registered.data.email, 'ana@example.com');
  assert.equal(registered.data.name, 'Ana');
  assert.deepEqual(Object.keys(registered.data).sort(), ['email', 'id', 'name']);
  assert.equal((await request('/auth/register', credentials)).status, 409);
  for (const body of [{ ...credentials, name: '' }, { ...credentials, name: 'x'.repeat(81) }, { ...credentials, email: 'invalid' }, { ...credentials, password: 'short' }]) {
    assert.equal((await request('/auth/register', body)).status, 400);
  }
  const logged = await request('/auth/login', credentials);
  assert.equal(logged.status, 200);
  assert.equal((await request('/auth/me', undefined, logged.data.token)).data.id, registered.data.id);
  assert.equal((await request('/auth/me')).status, 401);
  assert.equal((await request('/auth/me', undefined, `${logged.data.token}x`)).status, 401);
  assert.equal((await request('/auth/me', undefined, createToken('deleted-user', secret))).status, 404);
  assert.equal((await request('/auth/login', {})).status, 400);
  const wrongPassword = await request('/auth/login', { ...credentials, password: 'wrong-password' });
  const unknownEmail = await request('/auth/login', { ...credentials, email: 'missing@example.com' });
  assert.deepEqual(wrongPassword, unknownEmail);
  assert.equal(wrongPassword.status, 401);
  assert.equal(wrongPassword.data.message, 'E-mail ou senha inválidos');
  assert.deepEqual(await request('/missing'), { status: 404, data: { message: 'Rota não encontrada' } });
  assert.equal((await request('/auth/register', { ...credentials, name: 'x'.repeat(11000) })).status, 413);
  const malformed = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(malformed.status, 400);
  const preflight = await fetch(`${base}/auth/login`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST' } });
  assert.equal(preflight.status, 200);
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.equal(preflight.headers.get('access-control-allow-methods'), 'GET, POST, OPTIONS');
  const forbidden = await fetch(base, { headers: { Origin: 'https://untrusted.example' } });
  assert.equal(forbidden.status, 403);
  assert.equal(forbidden.headers.get('access-control-allow-origin'), null);
  const concurrent = await Promise.all(Array.from({ length: 5 }, () => request('/auth/register', { ...credentials, email: 'concurrent@example.com' })));
  assert.equal(concurrent.filter(result => result.status === 201).length, 1);
  assert.equal(concurrent.filter(result => result.status === 409).length, 4);
  const different = await Promise.all(Array.from({ length: 5 }, (_, index) => request('/auth/register', { ...credentials, email: `person${index}@example.com` })));
  assert.ok(different.every(result => result.status === 201));
  const stored = JSON.parse(await readFile(join(temporary, 'data/users.json'), 'utf8'));
  assert.equal(stored.length, 7);
  assert.ok(stored.every(user => user.hash && user.salt && !('password' in user)));
  const withoutSecret = spawn(process.execPath, ['src/server.ts'], { cwd: temporary, env: { ...process.env, TOKEN_SECRET: '' }, stdio: 'ignore' });
  const [code] = await once(withoutSecret, 'exit');
  assert.notEqual(code, 0);
});

import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StoredUser } from '../types.ts';
import { HttpError } from './http.ts';

const file = fileURLToPath(new URL('../../data/users.json', import.meta.url));
let pending: Promise<void> = Promise.resolve();

function isUser(value: unknown): value is StoredUser {
  if (!value || typeof value !== 'object') return false;
  return ['id', 'name', 'email', 'salt', 'hash'].every(key =>
    key in value && typeof (value as Record<string, unknown>)[key] === 'string');
}

async function readUsers(): Promise<StoredUser[]> {
  const data: unknown = JSON.parse(await readFile(file, 'utf8'));
  if (!Array.isArray(data) || !data.every(isUser)) throw new Error('Arquivo de usuários inválido');
  return data;
}

async function writeUsers(users: StoredUser[]) {
  const temporary = join(dirname(file), `.users-${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, JSON.stringify(users, null, 2), { mode: 0o600, flag: 'wx' });
    await rename(temporary, file);
  } finally {
    await unlink(temporary).catch((error: unknown) => {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
    });
  }
}

export async function initializeDb() {
  await mkdir(dirname(file), { recursive: true });
  try {
    await readUsers();
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') await writeUsers([]);
    else throw error;
  }
}

export async function findUser(field: 'id' | 'email', value: string) {
  await pending;
  return (await readUsers()).find(user => user[field] === value);
}

export function insertUser(user: StoredUser): Promise<void> {
  // A leitura, a checagem de duplicidade e a escrita pertencem à mesma fila.
  const operation = pending.then(async () => {
    const users = await readUsers();
    if (users.some(existing => existing.email === user.email)) throw new HttpError(409, 'E-mail já cadastrado');
    users.push(user);
    await writeUsers(users);
  });
  pending = operation.catch(() => undefined);
  return operation;
}

import type { IncomingMessage, ServerResponse } from 'node:http';

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function json(response: ServerResponse, status: number, data: unknown) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(data));
}

export function cors(request: IncomingMessage, response: ServerResponse, origin: string) {
  response.setHeader('Vary', 'Origin');
  if (request.headers.origin && request.headers.origin !== origin) {
    throw new HttpError(403, 'Origem não permitida');
  }
  if (request.headers.origin === origin) response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let failed = false;
    request.on('data', (chunk: Buffer) => {
      if (failed) return;
      size += chunk.length;
      if (size > 10 * 1024) {
        failed = true;
        chunks.length = 0;
        reject(new HttpError(413, 'O corpo da requisição excede 10 KB'));
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (failed) return;
      if (request.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
        reject(new HttpError(400, 'Envie o corpo como application/json'));
        return;
      }
      try {
        const body: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid body');
        resolve(body as Record<string, unknown>);
      } catch {
        reject(new HttpError(400, 'Corpo JSON inválido'));
      }
    });
    request.on('error', reject);
    request.on('aborted', () => reject(new HttpError(400, 'Requisição interrompida')));
  });
}

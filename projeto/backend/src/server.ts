import { createServer } from 'node:http';
import { initializeDb } from './lib/db.ts';
import { cors, HttpError, json } from './lib/http.ts';
import { login, me, register } from './routes/auth.ts';

const secret = process.env.TOKEN_SECRET?.trim();
const port = Number(process.env.PORT ?? 3000);
const origin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

if (!secret) throw new Error('TOKEN_SECRET é obrigatória. Configure o arquivo .env.');
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválida');
await initializeDb();

const server = createServer(async (request, response) => {
  try {
    cors(request, response, origin);
    if (request.method === 'OPTIONS') {
      json(response, 200, { message: 'OK' });
      return;
    }
    const path = new URL(request.url ?? '/', 'http://localhost').pathname;
    if (request.method === 'POST' && path === '/api/auth/register') await register(request, response);
    else if (request.method === 'POST' && path === '/api/auth/login') await login(request, response, secret);
    else if (request.method === 'GET' && path === '/api/auth/me') await me(request, response, secret);
    else throw new HttpError(404, 'Rota não encontrada');
  } catch (error) {
    if (error instanceof HttpError) json(response, error.status, { message: error.message });
    else {
      console.error('Erro inesperado no servidor:', error);
      json(response, 500, { message: 'Erro interno do servidor' });
    }
  }
});

server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.on('error', error => {
  console.error('Não foi possível iniciar o servidor:', error);
  process.exitCode = 1;
});
server.listen(port, 'localhost');

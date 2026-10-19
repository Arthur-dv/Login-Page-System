# Refúgio

Login e cadastro locais, em português, com React + TypeScript e uma API REST feita exclusivamente com módulos nativos do Node.js. O fundo é uma imagem incluída no projeto: o aplicativo não chama serviços externos, CDNs ou fontes remotas.

## Organização

- `backend/src/server.ts`: configuração e roteamento HTTP.
- `backend/src/routes/auth.ts`: cadastro, login e consulta da sessão.
- `backend/src/lib`: body JSON, CORS, persistência, scrypt e HMAC.
- `frontend/src/components`: Input, Button, ProtectedRoute, ícones e painel.
- `frontend/src/contexts` e `hooks`: estado e restauração da autenticação.
- `frontend/src/pages`: Login, Register e Home.
- `frontend/src/services`: fetch tipado e autenticação.
- `frontend/src/router.tsx`: History API e voltar/avançar, sem biblioteca.
- `frontend/src/styles/global.css`: estilo responsivo e variáveis CSS.
- `frontend/public/forest.png`: fundo local.
- `CODIGO_COMPLETO.md`: todos os arquivos de código e configuração, por caminho, em blocos completos.

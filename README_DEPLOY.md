# Trilha do Eleitor - Guia de Deploy

## Estrutura

- `trilhadoeleitor/`: frontend React + Vite, deploy recomendado na Vercel.
- `backend/`: backend FastAPI + SQLite, deploy recomendado no Render.

## Rodando localmente

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 1234
```

### Frontend

```bash
cd trilhadoeleitor
npm install
npm run dev
```

### Variáveis locais do frontend

Crie `trilhadoeleitor/.env` com:

```env
VITE_API_URL=http://127.0.0.1:1234
```

### Variáveis locais do backend

Crie `backend/.env` com:

```env
EMAIL_ADM=seu_email_admin
EMAIL_PASSWORD=sua_senha_de_app
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:1234
DATABASE_URL=sqlite:///./usuarios.db
```

## Deploy do backend no Render

### Configuração

- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Variáveis de ambiente no Render

```env
FRONTEND_URL=https://URL-DA-VERCEL.vercel.app
BACKEND_URL=https://nome-do-backend.onrender.com
EMAIL_ADM=seu_email_admin
EMAIL_PASSWORD=sua_senha_de_app
DATABASE_URL=sqlite:///./usuarios.db
```

Observação: SQLite funciona para testes e apresentação, mas o armazenamento pode ser perdido em reinícios do serviço gratuito.

## Deploy do frontend na Vercel

### Configuração

- Root Directory: `trilhadoeleitor`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

### Variável de ambiente na Vercel

```env
VITE_API_URL=https://URL-DO-BACKEND.onrender.com
```

Depois de alterar `VITE_API_URL`, faça novo deploy do frontend.

## Fluxo recomendado de deploy

1. Corrija o código localmente.
2. Teste backend e frontend no computador.
3. Envie o código limpo para o GitHub.
4. Faça deploy do backend no Render.
5. Copie a URL pública do backend.
6. Configure `VITE_API_URL` na Vercel.
7. Faça deploy do frontend na Vercel.
8. Copie a URL pública da Vercel.
9. Volte ao Render e configure `FRONTEND_URL` com a URL da Vercel.
10. Redeploye o backend.
11. Teste a aplicação completa online.

## Checklist de testes

- A página inicial abre.
- Cadastro funciona.
- Login funciona.
- Perfil carrega.
- Edição de perfil funciona.
- Imagens e uploads carregam.
- Trilhas aparecem.
- Inscrição em trilha funciona.
- Nenhuma requisição do frontend chama localhost em produção.
- Não há erro de CORS no console do navegador.
- O backend responde em `/docs`.
- Os endpoints principais respondem corretamente.
- O build do frontend conclui sem erro.
- O Render não mostra erro de dependência.
- A Vercel não mostra erro de variável ausente.

## Problemas comuns

### Erro de CORS

- Verifique `FRONTEND_URL` no Render.
- Confirme se a URL da Vercel foi escrita exatamente igual.
- Faça redeploy do backend.

### Erro 404 nas requisições da API

- Verifique `VITE_API_URL`.
- Confirme se o backend está online.
- Abra `/docs` no backend e confira a rota.

### Erro 500 no backend

- Verifique os logs do Render.
- Confirme `EMAIL_ADM` e `EMAIL_PASSWORD`.
- Confira se o SQLite foi criado corretamente.
- Verifique se a pasta `uploads` existe.

### Frontend abre, mas cadastro/login falha

- Abra o DevTools.
- Veja a aba Network.
- Confirme se a URL chamada não está apontando para localhost.

### Render no plano gratuito demora para responder

- O primeiro acesso pode demorar.
- Isso é normal em serviços gratuitos com cold start.

## Observações importantes

- SQLite é suficiente para estudo e demonstração, mas não é ideal para produção real.
- Uploads locais no Render gratuito podem ser perdidos em reinicializações.
- Para produção definitiva, o ideal é usar PostgreSQL e armazenamento externo como S3, Cloudinary ou Supabase Storage.
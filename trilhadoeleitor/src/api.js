import axios from 'axios';

// Em desenvolvimento, usa o backend local. Em produção, defina a variável de
// ambiente VITE_API_URL (na Vercel ou no arquivo .env) com a URL pública do backend.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:1234',
});

// Algumas imagens (ex: fotos de perfil) podem vir como URL completa do Cloudinary
// (https://res.cloudinary.com/...) ou como caminho relativo do backend (/uploads/...),
// dependendo de como o servidor está configurado. Essa função trata os dois casos.
export function resolverUrlImagem(caminho) {
  if (!caminho) return null;
  if (caminho.startsWith('http://') || caminho.startsWith('https://')) {
    return caminho;
  }
  return `${api.defaults.baseURL}${caminho}`;
}

export default api;
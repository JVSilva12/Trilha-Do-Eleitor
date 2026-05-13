import api from '../api';
import { emailUsuarioLogado } from './authService';

export const CATEGORIAS_FIXAS = [
  'Processo Eleitoral',
  'Segurança do Voto',
  'Educação eleitoral',
  'Cidadania Digital',
];

function obterEmailSessao() {
  const email = emailUsuarioLogado();
  if (!email) {
    throw new Error('Sessão inválida. Faça login novamente.');
  }
  return email;
}

export function listarCategorias() {
  return [...CATEGORIAS_FIXAS];
}

export function filtrarTrilhas({ trilhas = [], busca = '', categoria = 'todas', status = 'todas' }) {
  const termo = busca.trim().toLowerCase();

  return trilhas.filter((trilha) => {
    const matchBusca = trilha.nome.toLowerCase().includes(termo);
    const matchCategoria = categoria === 'todas' || trilha.categoria === categoria;
    const matchStatus = status === 'todas' || trilha.status === status;
    return matchBusca && matchCategoria && matchStatus;
  });
}

export async function listarTrilhas() {
  const email = obterEmailSessao();
  const { data } = await api.get('/trilhas', { params: { email } });
  return data;
}

export async function buscarTrilhaPorId(id) {
  const { data } = await api.get(`/trilhas/${id}`);
  return data;
}

export async function criarTrilha(payload) {
  const email = obterEmailSessao();
  const body = {
    email_conteudista: email,
    nome: payload.nome,
    descricao: payload.descricao,
    categoria: payload.categoria,
    nivel: payload.nivel,
    imagem: payload.imagem || null,
    status: payload.status,
    visibilidade: payload.visibilidade,
  };

  const { data } = await api.post('/trilhas', body);
  return data;
}

export async function atualizarTrilha(id, payload) {
  const { data } = await api.put(`/trilhas/${id}`, payload);
  return data;
}

export async function excluirTrilha(id) {
  await api.delete(`/trilhas/${id}`);
}

export async function publicarTrilha(id) {
  const { data } = await api.post(`/trilhas/${id}/publicar`);
  return data;
}

export async function listarModulosPorTrilha(id) {
  const { data } = await api.get(`/trilhas/${id}/modulos`);
  return data;
}

export async function criarModulo(trilhaId, payload) {
  const body = {
    titulo: payload.titulo,
    videos: Number(payload.videos || 0),
    textos: Number(payload.textos || 0),
    quizzes: Number(payload.quizzes || 0),
    duracao: payload.duracao || '0 min',
    status: payload.status || 'rascunho',
    videoAdicionado: Boolean(payload.videoAdicionado),
    textoAdicionado: Boolean(payload.textoAdicionado),
    quizAdicionado: Boolean(payload.quizAdicionado),
  };

  const { data } = await api.post(`/trilhas/${trilhaId}/modulos`, body);
  return data;
}

export async function atualizarModulo(trilhaId, moduloId, payload) {
  const body = {
    ...payload,
    videos: payload.videos !== undefined ? Number(payload.videos) : undefined,
    textos: payload.textos !== undefined ? Number(payload.textos) : undefined,
    quizzes: payload.quizzes !== undefined ? Number(payload.quizzes) : undefined,
  };

  const { data } = await api.put(`/trilhas/${trilhaId}/modulos/${moduloId}`, body);
  return data;
}

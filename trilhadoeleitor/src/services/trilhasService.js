import api from '../api';

/**
 * 1. Busca todas as trilhas cadastradas no banco de dados SQLite (Python FastAPI)
 */
export const listarTrilhas = async () => {
  try {
    const response = await api.get('/trilhas');
    return response.data; // Retorna o array de trilhas vindo do banco
  } catch (error) {
    console.error("Erro ao listar trilhas do servidor:", error);
    throw error;
  }
};

/**
 * 2. Envia os dados do formulário para salvar uma nova trilha educativa no banco
 */
export const criarTrilha = async (dadosTrilha) => {
  try {
    // Envia o payload no padrão JSON esperado pelo TrilhaSchema do Pydantic
    const response = await api.post('/trilhas', {
      nome: dadosTrilha.nome,
      descricao: dadosTrilha.descricao,
      categoria: dadosTrilha.categoria,
      nivel: dadosTrilha.nivel,
      imagem: dadosTrilha.imagem || null,
      status: dadosTrilha.status || 'rascunho'
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao cadastrar nova trilha no servidor:", error);
    throw error;
  }
};

/**
 * 3. Remove uma trilha de forma definitiva do banco de dados utilizando o ID numérico
 */
export const excluirTrilha = async (trilhaId) => {
  try {
    const response = await api.delete(`/trilhas/${trilhaId}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao remover a trilha ID ${trilhaId}:`, error);
    throw error;
  }
};

/**
 * 4. Salva ou atualiza a aula teórica (com texto e link de vídeo) de uma trilha
 */
export const salvarTeoriaTrilha = async (trilhaId, dadosTeoria) => {
  const response = await api.post(`/trilhas/${trilhaId}/teoria`, dadosTeoria);
  return response.data;
};

/**
 * 5. Busca o texto e vídeo de teoria cadastrados de uma trilha específica
 */
export const buscarTeoriaTrilha = async (trilhaId) => {
  const response = await api.get(`/trilhas/${trilhaId}/teoria`);
  return response.data;
};

/**
 * 6. Adiciona uma nova pergunta de múltipla escolha ao banco do Quiz da trilha
 */
export const adicionarPerguntaQuiz = async (trilhaId, dadosQuiz) => {
  const response = await api.post(`/trilhas/${trilhaId}/quiz`, dadosQuiz);
  return response.data;
};

/**
 * 7. Recupera o caderno completo de questões do Quiz de uma trilha específica
 */
export const listarPerguntasQuiz = async (trilhaId) => {
  const response = await api.get(`/trilhas/${trilhaId}/quiz`);
  return response.data;
};

/**
 * =========================================================================
 * FUNÇÕES AUXILIARES DE SUPORTE (Mantidas para não quebrar o GerenciarTrilhas)
 * =========================================================================
 */

/**
 * Filtra a lista de trilhas em tempo de execução no frontend com base na busca por texto,
 * na categoria selecionada e no status (Todas, Publicadas ou Rascunhos).
 */
export const filtrarTrilhas = ({ trilhas, busca, categoria, status }) => {
  if (!trilhas || !Array.isArray(trilhas)) return [];

  return trilhas.filter((trilha) => {
    // Filtro por termo de busca (Nome)
    const correspondeBusca = busca
      ? trilha.nome.toLowerCase().includes(busca.toLowerCase())
      : true;

    // Filtro por Categoria
    const correspondeCategoria = categoria && categoria !== 'todas'
      ? trilha.categoria === categoria
      : true;

    // Filtro por Status (Tabs)
    const correspondeStatus = status && status !== 'todas'
      ? trilha.status === status
      : true;

    return correspondeBusca && correspondeCategoria && correspondeStatus;
  });
};

/**
 * Extrai dinamicamente todas as categorias únicas das trilhas existentes 
 * para popular o menu suspenso (select) de filtros do cabeçalho.
 */
export const listarCategorias = (trilhas) => {
  if (!trilhas || !Array.isArray(trilhas)) return [];
  
  // Utiliza o Set para remover duplicatas automaticamente
  const listaUnica = new Set(trilhas.map((trilha) => trilha.categoria));
  return Array.from(listaUnica);
};
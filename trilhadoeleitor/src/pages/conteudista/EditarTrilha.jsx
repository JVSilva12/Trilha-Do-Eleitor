import { Link, useParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import ModuloCard from '../../components/Trilhas/ModuloCard';
import StatusBadge from '../../components/Trilhas/StatusBadge';
import {
  atualizarModulo,
  atualizarTrilha,
  buscarTrilhaPorId,
  criarModulo,
  listarModulosPorTrilha,
  publicarTrilha,
} from '../../services/trilhasService';
import {
  BookIcon,
  CircleQuestionIcon,
  ClockIcon,
  EyeIcon,
  InfoIcon,
  PlayIcon,
  PlusIcon,
  SaveIcon,
  SendIcon,
} from '../../components/Trilhas/TrilhaIcons';

const categorias = [
  'Educação eleitoral',
  'Cidadania digital',
  'Participação cidadã',
  'Democracia',
  'Segurança da informação',
];

const niveis = ['Básico', 'Intermediário', 'Avançado'];

const moduloInicial = {
  titulo: '',
  videos: 0,
  textos: 0,
  quizzes: 0,
  duracao: '0 min',
  status: 'rascunho',
  videoAdicionado: false,
  textoAdicionado: false,
  quizAdicionado: false,
};

export default function EditarTrilha() {
  const { id } = useParams();
  const [abaAtiva, setAbaAtiva] = useState('modulos');
  const [trilha, setTrilha] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [formGeral, setFormGeral] = useState({ nome: '', descricao: '' });
  const [formConfig, setFormConfig] = useState({
    categoria: 'Educação eleitoral',
    nivel: 'Básico',
    status: 'rascunho',
    visibilidade: 'Pública',
  });

  const [moduloAberto, setModuloAberto] = useState(false);
  const [moduloEditando, setModuloEditando] = useState(null);
  const [formModulo, setFormModulo] = useState(moduloInicial);

  const carregarTela = useCallback(async () => {
    setCarregando(true);
    try {
      const [dadosTrilha, dadosModulos] = await Promise.all([
        buscarTrilhaPorId(id),
        listarModulosPorTrilha(id),
      ]);

      setTrilha(dadosTrilha);
      setModulos(dadosModulos);
      setFormGeral({ nome: dadosTrilha.nome || '', descricao: dadosTrilha.descricao || '' });
      setFormConfig({
        categoria: dadosTrilha.categoria || 'Educação eleitoral',
        nivel: dadosTrilha.nivel || 'Básico',
        status: dadosTrilha.status || 'rascunho',
        visibilidade: dadosTrilha.visibilidade || 'Pública',
      });
    } catch (error) {
      alert(error.response?.data?.detail || 'Não foi possível carregar a trilha.');
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarTela();
    }, 0);

    return () => clearTimeout(timer);
  }, [carregarTela]);

  const abrirNovoModulo = () => {
    setModuloEditando(null);
    setFormModulo(moduloInicial);
    setModuloAberto(true);
  };

  const abrirEditarModulo = (modulo) => {
    setModuloEditando(modulo);
    setFormModulo({
      titulo: modulo.titulo,
      videos: modulo.videos,
      textos: modulo.textos,
      quizzes: modulo.quizzes,
      duracao: modulo.duracao,
      status: modulo.status,
      videoAdicionado: modulo.videoAdicionado,
      textoAdicionado: modulo.textoAdicionado,
      quizAdicionado: modulo.quizAdicionado,
    });
    setModuloAberto(true);
  };

  const salvarModulo = async (evento) => {
    evento.preventDefault();
    try {
      if (moduloEditando) {
        await atualizarModulo(id, moduloEditando.id, formModulo);
      } else {
        await criarModulo(id, formModulo);
      }
      setModuloAberto(false);
      await carregarTela();
    } catch (error) {
      alert(error.response?.data?.detail || 'Não foi possível salvar o módulo.');
    }
  };

  const salvarGeral = async () => {
    try {
      await atualizarTrilha(id, {
        nome: formGeral.nome,
        descricao: formGeral.descricao,
      });
      await carregarTela();
      alert('Visão geral salva com sucesso.');
    } catch (error) {
      alert(error.response?.data?.detail || 'Erro ao salvar visão geral.');
    }
  };

  const salvarConfig = async () => {
    try {
      await atualizarTrilha(id, {
        categoria: formConfig.categoria,
        nivel: formConfig.nivel,
        status: formConfig.status,
        visibilidade: formConfig.visibilidade,
      });
      await carregarTela();
      alert('Configurações salvas com sucesso.');
    } catch (error) {
      alert(error.response?.data?.detail || 'Erro ao salvar configurações.');
    }
  };

  const publicar = async () => {
    try {
      await publicarTrilha(id);
      await carregarTela();
      alert('Trilha publicada com sucesso.');
    } catch (error) {
      alert(error.response?.data?.detail || 'Não foi possível publicar a trilha.');
    }
  };

  if (carregando) {
    return (
      <section className="page-card-frame">
        <p className="texto-secundario">Carregando trilha...</p>
      </section>
    );
  }

  if (!trilha) {
    return (
      <section className="page-card-frame">
        <Link to="/conteudista/trilhas" className="link-voltar">
          ← Voltar para trilhas
        </Link>
        <p>Trilha não encontrada.</p>
      </section>
    );
  }

  return (
    <section className="page-card-frame">
      <Link to="/conteudista/trilhas" className="link-voltar">
        ← Voltar para trilhas
      </Link>

      <div className="secao-header principal-header">
        <div>
          <h2>
            {trilha.nome} <span className="icone-edicao">✎</span>
          </h2>
          <p>Gerencie os módulos, aulas, conteúdos e quizzes da trilha.</p>
        </div>
        <div className="resumo-status">
          <StatusBadge status={trilha.status} />
          <small>Atualizada em {trilha.atualizadaEm}</small>
        </div>
      </div>

      <article className="resumo-trilha-card resumo-trilha-fino">
        <img src={trilha.imagem} alt={trilha.nome} />

        <div className="resumo-grid">
          <div>
            <BookIcon className="mini-icon" />
            <strong>{trilha.modulos}</strong>
            <span>Módulos</span>
          </div>
          <div>
            <PlayIcon className="mini-icon" />
            <strong>{trilha.aulas}</strong>
            <span>Aulas</span>
          </div>
          <div>
            <CircleQuestionIcon className="mini-icon" />
            <strong>{trilha.quizzes}</strong>
            <span>Quizzes</span>
          </div>
          <div>
            <ClockIcon className="mini-icon" />
            <strong>{trilha.duracaoTotal}</strong>
            <span>Duração total</span>
          </div>
        </div>
      </article>

      <div className="tabs-status tabs-pill-frame tabs-editar">
        <button type="button" className={abaAtiva === 'modulos' ? 'ativo' : ''} onClick={() => setAbaAtiva('modulos')}>
          Módulos
        </button>
        <button type="button" className={abaAtiva === 'visao' ? 'ativo' : ''} onClick={() => setAbaAtiva('visao')}>
          Visão geral
        </button>
        <button type="button" className={abaAtiva === 'config' ? 'ativo' : ''} onClick={() => setAbaAtiva('config')}>
          Configurações
        </button>
        <button type="button" className={abaAtiva === 'publicacao' ? 'ativo' : ''} onClick={() => setAbaAtiva('publicacao')}>
          Publicação
        </button>
      </div>

      {abaAtiva === 'modulos' && (
        <>
          <div className="secao-header secao-modulos-header">
            <div>
              <h3>Módulos da trilha</h3>
              <p>Organize a ordem dos módulos e gerencie os conteúdos.</p>
            </div>
            <button type="button" className="btn-primario btn-nova-trilha" onClick={abrirNovoModulo}>
              <PlusIcon className="mini-icon" />
              Novo módulo
            </button>
          </div>

          <div className="modulos-grid modulos-lista">
            {modulos.map((modulo) => (
              <ModuloCard key={modulo.id} modulo={modulo} onEditar={abrirEditarModulo} />
            ))}

            <article className="add-modulo-card" onClick={abrirNovoModulo} role="button" tabIndex={0}>
              <span>+</span>
              <h4>Adicionar novo módulo</h4>
              <p>Crie novos módulos para estruturar sua trilha.</p>
            </article>
          </div>

          <div className="barra-rodape barra-publicacao">
            <button type="button" className="btn-secundario btn-rodape">
              <EyeIcon className="mini-icon" />
              Visualizar como Usuario Comum
            </button>
            <button type="button" className="btn-secundario btn-rodape" onClick={salvarConfig}>
              <SaveIcon className="mini-icon" />
              Salvar alterações
            </button>
            <button type="button" className="btn-primario btn-rodape" onClick={publicar}>
              <SendIcon className="mini-icon" />
              Publicar trilha
            </button>

            <p className="aviso-publicacao">
              <InfoIcon className="mini-icon" /> Ao publicar, a trilha ficará disponível para todos os usuarios comuns.
            </p>
          </div>
        </>
      )}

      {abaAtiva === 'visao' && (
        <article className="bloco-form">
          <h3>Visão geral da trilha</h3>
          <label>
            Nome da trilha
            <input
              className="input-padrao"
              value={formGeral.nome}
              onChange={(e) => setFormGeral((old) => ({ ...old, nome: e.target.value }))}
            />
          </label>
          <label>
            Descrição
            <textarea
              className="input-padrao"
              value={formGeral.descricao}
              onChange={(e) => setFormGeral((old) => ({ ...old, descricao: e.target.value }))}
            />
          </label>
          <div className="form-acoes">
            <button type="button" className="btn-primario" onClick={salvarGeral}>
              Salvar visão geral
            </button>
          </div>
        </article>
      )}

      {abaAtiva === 'config' && (
        <article className="bloco-form">
          <h3>Configurações da trilha</h3>
          <div className="duas-colunas">
            <label>
              Categoria
              <select
                className="input-padrao"
                value={formConfig.categoria}
                onChange={(e) => setFormConfig((old) => ({ ...old, categoria: e.target.value }))}
              >
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>

            <label>
              Nível
              <select
                className="input-padrao"
                value={formConfig.nivel}
                onChange={(e) => setFormConfig((old) => ({ ...old, nivel: e.target.value }))}
              >
                {niveis.map((nivel) => (
                  <option key={nivel} value={nivel}>{nivel}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="duas-colunas">
            <label>
              Status
              <select
                className="input-padrao"
                value={formConfig.status}
                onChange={(e) => setFormConfig((old) => ({ ...old, status: e.target.value }))}
              >
                <option value="rascunho">Rascunho</option>
                <option value="publicada">Publicada</option>
              </select>
            </label>

            <label>
              Visibilidade
              <select
                className="input-padrao"
                value={formConfig.visibilidade}
                onChange={(e) => setFormConfig((old) => ({ ...old, visibilidade: e.target.value }))}
              >
                <option value="Pública">Pública</option>
                <option value="Privada">Privada</option>
              </select>
            </label>
          </div>

          <div className="form-acoes">
            <button type="button" className="btn-primario" onClick={salvarConfig}>
              Salvar configurações
            </button>
          </div>
        </article>
      )}

      {abaAtiva === 'publicacao' && (
        <article className="bloco-form">
          <h3>Publicação da trilha</h3>
          <p className="texto-secundario">
            Status atual: <strong>{trilha.status === 'publicada' ? 'Publicada' : 'Rascunho'}</strong>
          </p>
          <div className="form-acoes">
            <button type="button" className="btn-primario" onClick={publicar}>
              Publicar trilha agora
            </button>
          </div>
        </article>
      )}

      {moduloAberto && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>{moduloEditando ? 'Editar módulo' : 'Novo módulo'}</h3>

            <form onSubmit={salvarModulo} className="form-trilha">
              <label>
                Título
                <input
                  className="input-padrao"
                  value={formModulo.titulo}
                  onChange={(e) => setFormModulo((old) => ({ ...old, titulo: e.target.value }))}
                  required
                />
              </label>

              <div className="duas-colunas">
                <label>
                  Vídeos
                  <input
                    className="input-padrao"
                    type="number"
                    min="0"
                    value={formModulo.videos}
                    onChange={(e) => setFormModulo((old) => ({ ...old, videos: Number(e.target.value) }))}
                  />
                </label>
                <label>
                  Textos
                  <input
                    className="input-padrao"
                    type="number"
                    min="0"
                    value={formModulo.textos}
                    onChange={(e) => setFormModulo((old) => ({ ...old, textos: Number(e.target.value) }))}
                  />
                </label>
              </div>

              <div className="duas-colunas">
                <label>
                  Quizzes
                  <input
                    className="input-padrao"
                    type="number"
                    min="0"
                    value={formModulo.quizzes}
                    onChange={(e) => setFormModulo((old) => ({ ...old, quizzes: Number(e.target.value) }))}
                  />
                </label>
                <label>
                  Duração
                  <input
                    className="input-padrao"
                    value={formModulo.duracao}
                    onChange={(e) => setFormModulo((old) => ({ ...old, duracao: e.target.value }))}
                    placeholder="Ex.: 20 min"
                  />
                </label>
              </div>

              <label>
                Status
                <select
                  className="input-padrao"
                  value={formModulo.status}
                  onChange={(e) => setFormModulo((old) => ({ ...old, status: e.target.value }))}
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="publicado">Publicado</option>
                </select>
              </label>

              <div className="duas-colunas">
                <label className="radio-linha">
                  <input
                    type="checkbox"
                    checked={formModulo.videoAdicionado}
                    onChange={(e) => setFormModulo((old) => ({ ...old, videoAdicionado: e.target.checked }))}
                  />
                  <span>
                    <strong>Vídeo adicionado</strong>
                  </span>
                </label>

                <label className="radio-linha">
                  <input
                    type="checkbox"
                    checked={formModulo.textoAdicionado}
                    onChange={(e) => setFormModulo((old) => ({ ...old, textoAdicionado: e.target.checked }))}
                  />
                  <span>
                    <strong>Texto adicionado</strong>
                  </span>
                </label>
              </div>

              <label className="radio-linha">
                <input
                  type="checkbox"
                  checked={formModulo.quizAdicionado}
                  onChange={(e) => setFormModulo((old) => ({ ...old, quizAdicionado: e.target.checked }))}
                />
                <span>
                  <strong>Quiz adicionado</strong>
                </span>
              </label>

              <div className="modal-actions">
                <button type="button" className="btn-secundario" onClick={() => setModuloAberto(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primario">
                  Salvar módulo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

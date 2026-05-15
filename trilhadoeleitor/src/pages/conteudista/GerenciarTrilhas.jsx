import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import TrilhaCard from '../../components/Trilhas/TrilhaCard';
import DeleteTrilhaModal from '../../components/Trilhas/DeleteTrilhaModal';
import { excluirTrilha, filtrarTrilhas, listarCategorias, listarTrilhas } from '../../services/trilhasService';
import { ChevronDownIcon, FilterIcon, PlusIcon, SearchIcon } from '../../components/Trilhas/TrilhaIcons';

export default function GerenciarTrilhas() {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [status, setStatus] = useState('todas');
  const [idExcluir, setIdExcluir] = useState(null);
  const [trilhas, setTrilhas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const lista = await listarTrilhas();
      setTrilhas(lista);
    } catch (error) {
      alert(error.response?.data?.detail || 'Não foi possível carregar trilhas.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarDados();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const categorias = useMemo(() => listarCategorias(trilhas), [trilhas]);
  const trilhasFiltradas = useMemo(
    () => filtrarTrilhas({ trilhas, busca, categoria, status }),
    [trilhas, busca, categoria, status]
  );

  const total = trilhas.length;

  return (
    <section className="page-card-frame">
      <div className="secao-header principal-header">
        <div>
          <h2>Gerenciar Trilhas</h2>
          <p>Crie, edite e acompanhe as trilhas educativas.</p>
        </div>
        <Link className="btn-primario btn-nova-trilha" to="/conteudista/trilhas/nova">
          <PlusIcon className="mini-icon" />
          Nova trilha
        </Link>
      </div>

      <div className="filtros-linha">
        <label className="input-com-icone">
          <SearchIcon className="mini-icon" />
          <input
            type="text"
            placeholder="Buscar trilha"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            className="input-padrao"
          />
        </label>

        <label className="input-com-icone select-filtro">
          <FilterIcon className="mini-icon" />
          <select value={categoria} onChange={(evento) => setCategoria(evento.target.value)} className="input-padrao">
            <option value="todas">Todas as categorias</option>
            {categorias.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="mini-icon" />
        </label>
      </div>

      <div className="tabs-status tabs-pill-frame">
        <button type="button" className={status === 'todas' ? 'ativo' : ''} onClick={() => setStatus('todas')}>
          Todas
        </button>
        <button type="button" className={status === 'publicada' ? 'ativo' : ''} onClick={() => setStatus('publicada')}>
          Publicadas
        </button>
        <button type="button" className={status === 'rascunho' ? 'ativo' : ''} onClick={() => setStatus('rascunho')}>
          Rascunhos
        </button>
      </div>

      {carregando ? (
        <p className="texto-secundario">Carregando trilhas...</p>
      ) : (
        <div className="lista-trilhas">
          {trilhasFiltradas.map((trilha) => (
            <TrilhaCard key={trilha.id} trilha={trilha} onExcluir={setIdExcluir} />
          ))}
        </div>
      )}

      {!carregando && trilhasFiltradas.length === 0 && (
        <p className="texto-secundario">Nenhuma trilha encontrada com os filtros atuais.</p>
      )}

      <footer className="paginacao-card paginacao-real">
        <button type="button" className="btn-pagina">‹</button>
        <button type="button" className="btn-pagina ativo">1</button>
        <button type="button" className="btn-pagina">2</button>
        <button type="button" className="btn-pagina">3</button>
        <button type="button" className="btn-pagina pontos">...</button>
        <button type="button" className="btn-pagina">8</button>
        <button type="button" className="btn-pagina">›</button>
      </footer>

      <p className="texto-paginacao">Mostrando 1 a {Math.min(6, total)} de 45 trilhas</p>

      <DeleteTrilhaModal
        aberta={idExcluir !== null}
        onCancelar={() => setIdExcluir(null)}
        onConfirmar={async () => {
          try {
            await excluirTrilha(idExcluir);
            setIdExcluir(null);
            await carregarDados();
          } catch (error) {
            alert(error.response?.data?.detail || 'Não foi possível excluir a trilha.');
          }
        }}
      />
    </section>
  );
}

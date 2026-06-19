import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import logo from '../../assets/TDElogo.png'; 
import TrilhaCard from './TrilhaCard';
import DeleteTrilhaModal from './DeleteTrilhaModal';
import { excluirTrilha, filtrarTrilhas, listarCategorias, listarTrilhas } from '../../services/trilhasService';
import { ChevronDownIcon, FilterIcon, PlusIcon, SearchIcon } from '../../Icons'; 
import '../../styles/trilhas.css';

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:1234";

export default function GerenciarTrilhas({ emailUsuario, onVoltar, onIrParaNovaTrilha, onEditarTrilha }) {
  const [busca, setBusca] = useState(''); 
  const [categoria, setCategoria] = useState('todas'); 
  const [status, setStatus] = useState('todas'); 
  const [idExcluir, setIdExcluir] = useState(null); 
  const [trilhas, setTrilhas] = useState([]); 
  const [carregando, setCarregando] = useState(true);
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [apelido, setApelido] = useState('');

  useEffect(() => {
    async function carregarDadosCabecalho() {
      if (!emailUsuario) return;
      try {
        const resPerfil = await axios.get(`${API_URL}/perfil/${emailUsuario}`);
        setApelido(resPerfil.data.apelido);
        if (resPerfil.data.foto_perfil) setFotoPerfil(`${API_URL}${resPerfil.data.foto_perfil}`);
      } catch (error) { console.error(error); }
    }
    carregarDadosCabecalho();
  }, [emailUsuario]);

  const carregarDados = async () => { 
    setCarregando(true); 
    try { 
      const lista = await listarTrilhas(); 
      setTrilhas(lista); 
    } catch (error) { 
      alert('Erro ao buscar trilhas.'); 
    } finally { setCarregando(false); } 
  }; 

  useEffect(() => { carregarDados(); }, []); 

  const categories = useMemo(() => listarCategorias(trilhas), [trilhas]); 
  const trilhasFiltradas = useMemo( 
    () => filtrarTrilhas({ trilhas, busca, categoria, status }), 
    [trilhas, busca, categoria, status] 
  ); 

  const total = trilhas.length; 
  const gerarIniciais = (nome) => nome ? nome.substring(0, 2).toUpperCase() : "U";

  return (
    <div className="home-page">
      <div className="home-banner" />
      <header className="home-header">
        <div className="home-logo" onClick={onVoltar} style={{ cursor: 'pointer' }}><img src={logo} alt="Logo" /></div>
        <div className="header-actions">
          <button className="nav-btn" onClick={onVoltar}>Voltar para Início</button>
          <button className="conteudista-btn" onClick={onIrParaNovaTrilha}><PlusIcon /> Nova Trilha</button>
          <div className="header-avatar" onClick={onVoltar}>{fotoPerfil ? <img src={fotoPerfil} alt="P" /> : gerarIniciais(apelido)}</div>
        </div>
      </header>

      <main className="home-main">
        <div className="welcome-section">
          <h2>Gerenciar Trilhas Educativas</h2>
          <p>Olá, Conteudista <strong>{apelido}</strong>! Gerencie os módulos pedagógicos da plataforma.</p>
        </div>

        <div className="filtros-linha" style={{ display: 'flex', gap: '12px', margin: '24px 0' }}>
          <label className="input-com-icone" style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#fff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <SearchIcon /> 
            <input type="text" placeholder="Buscar trilha pelo nome..." value={busca} onChange={(e) => setBusca(e.target.value)} style={{ border: 0, outline: 0, width: '100%', fontSize: '14px', marginLeft: '8px' }} />
          </label> 
          <label className="input-com-icone select-filtro" style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <FilterIcon /> 
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{ border: 0, outline: 0, background: 'transparent', fontSize: '14px', cursor: 'pointer', marginLeft: '8px' }}> 
              <option value="todas">Todas as categorias</option> 
              {categories.map((item) => ( <option key={item} value={item}>{item}</option> ))} 
            </select> 
            <ChevronDownIcon /> 
          </label> 
        </div>

        <div className="tabs-status" style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}> 
          <button type="button" className="nav-btn" onClick={() => setStatus('todas')} style={{ background: status === 'todas' ? '#1e3a8a' : '#fff', color: status === 'todas' ? '#fff' : '#1e293b' }}>Todas</button> 
          <button type="button" className="nav-btn" onClick={() => setStatus('publicada')} style={{ background: status === 'publicada' ? '#1e3a8a' : '#fff', color: status === 'publicada' ? '#fff' : '#1e293b' }}>Publicadas</button> 
          <button type="button" className="nav-btn" onClick={() => setStatus('rascunho')} style={{ background: status === 'rascunho' ? '#1e3a8a' : '#fff', color: status === 'rascunho' ? '#fff' : '#1e293b' }}>Rascunhos</button> 
        </div> 

        {carregando ? ( 
          <p className="texto-secundario">Carregando trilhas do servidor...</p> 
        ) : ( 
          <div className="lista-trilhas" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}> 
            {trilhasFiltradas.map((trilha) => ( 
              <TrilhaCard key={trilha.id} trilha={trilha} onExcluir={setIdExcluir} onEditar={onEditarTrilha} /> 
            ))} 
          </div> 
        )} 

        <footer className="paginacao-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}> 
          <div className="botoes-paginas" style={{ display: 'flex', gap: '6px' }}>
            <button type="button" className="nav-btn">‹</button> 
            <button type="button" className="nav-btn" style={{ background: '#1e3a8a', color: '#fff' }}>1</button> 
            <button type="button" className="nav-btn">›</button> 
          </div>
          <p className="texto-paginacao" style={{ fontSize: '13px', color: '#64748b' }}>Total de {total} trilhas cadastradas</p> 
        </footer> 

        <DeleteTrilhaModal 
          aberta={idExcluir !== null} 
          onCancelar={() => setIdExcluir(null)} 
          onConfirmar={async () => { 
            try { 
              await excluirTrilha(idExcluir); 
              setIdExcluir(null); 
              await carregarDados(); 
            } catch (error) { alert('Erro ao excluir trilha.'); } 
          }} 
        /> 
      </main>
    </div>
  ); 
}
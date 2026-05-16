import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import logo from './assets/TDElogo.png';
import fotoUrna from './assets/urna.png'; 
import fotoProcesso from './assets/processo.png'; 
import fotoFakeNews from './assets/fakenews.png'; 
import './Trilhas.css';

// Definição global da URL Base para blindar requisições do Axios
const API_URL = "http://127.0.0.1:8000";

export default function Trilhas({ emailUsuario, onLogout, onIrParaPerfil, onIrParaPainel, onVisualizarTeoria, onVisualizarQuiz }) {
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [apelido, setApelido] = useState('');
  const [inscricoes, setInscricoes] = useState([]); 
  const [trilhasBanco, setTrilhasBanco] = useState([]); 
  const [tipoUsuario, setTipoUsuario] = useState('leitor'); 

  // Mapeador dinâmico para resolver os assets locais ou strings de URL externas
  const mapearImagemTrilha = (imagemInformada) => {
    if (imagemInformada === 'urna') return fotoUrna;
    if (imagemInformada === 'processo') return fotoProcesso;
    if (imagemInformada === 'fakenews') return fotoFakeNews;
    if (imagemInformada && (imagemInformada.startsWith('http') || imagemInformada.startsWith('data:'))) {
      return imagemInformada;
    }
    return null; 
  };

  const carregarDadosDoServidor = useCallback(async () => {
    if (!emailUsuario) return;
    try {
      // 1. Sincroniza dados cadastrais e cargos de acesso
      const resPerfil = await axios.get(`${API_URL}/perfil/${emailUsuario}`);
      setApelido(resPerfil.data.apelido);
      setTipoUsuario(resPerfil.data.tipo_usuario || 'leitor');
      
      if (resPerfil.data.foto_perfil) {
        setFotoPerfil(`${API_URL}${resPerfil.data.foto_perfil}`);
      } else {
        setFotoPerfil(null);
      }
      
      // 2. Busca o acervo pedagógico real gravado no SQLite
      const resTrilhas = await axios.get(`${API_URL}/trilhas`);
      const apenasPublicadas = resTrilhas.data.filter(t => t.status === 'publicada');
      setTrilhasBanco(apenasPublicadas);
      
      // 3. Captura o vínculo de inscrições ativas do estudante
      const resInscricoes = await axios.get(`${API_URL}/inscricoes/${emailUsuario}`);
      setInscricoes(resInscricoes.data);
    } catch (error) { 
      console.error("Erro ao sincronizar dados da Home:", error); 
    }
  }, [emailUsuario]);

  useEffect(() => {
    carregarDadosDoServidor();
  }, [carregarDadosDoServidor]);

  useEffect(() => {
    if (tipoUsuario !== 'pendente') return;
    const intervalo = setInterval(() => {
      carregarDadosDoServidor();
    }, 4000);
    return () => clearInterval(intervalo);
  }, [tipoUsuario, carregarDadosDoServidor]);

  const handleSolicitarConteudista = async () => {
    try {
      const response = await axios.post(`${API_URL}/perfil/${emailUsuario}/solicitar-conteudista`);
      alert(response.data.message);
      setTipoUsuario('pendente'); 
    } catch (error) {
      alert("Erro: " + (error.response?.data?.detail || "Erro de conexão/rede"));
    }
  };

  const handleInscrever = async (trilha) => {
    const confirmar = window.confirm(`Deseja realmente se inscrever na trilha: ${trilha.nome}?`);
    if (confirmar) {
      try {
        await axios.post(`${API_URL}/inscrever?email=${emailUsuario}&trilha_id=${trilha.id}`);
        setInscricoes([...inscricoes, trilha.id]);
        alert("Inscrição realizada com sucesso! Os módulos de estudo foram liberados.");
      } catch (error) {
        alert("Erro ao realizar inscrição: " + (error.response?.data?.detail || "Tente novamente."));
      }
    }
  };

  const gerarIniciais = (nome) => nome ? nome.substring(0, 2).toUpperCase() : "U";

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-logo"><img src={logo} alt="TDE Logo" /></div>
        <div className="header-actions">
          
          {tipoUsuario === 'leitor' && (
            <button className="conteudista-btn" onClick={handleSolicitarConteudista}>
              Tornar-se Conteudista
            </button>
          )}
          {tipoUsuario === 'pendente' && (
            <button className="conteudista-btn pendente-btn" disabled style={{ background: '#94a3b8', cursor: 'not-allowed' }}>
              Aguardando Aprovação...
            </button>
          )}
          {tipoUsuario === 'conteudista' && (
            <button 
              className="conteudista-btn aprovado-btn" 
              style={{ background: '#1d4ed8', cursor: 'pointer' }}
              onClick={onIrParaPainel}
            >
              Painel Conteudista
            </button>
          )}

          <button className="nav-btn" onClick={onIrParaPerfil}>Editar Perfil</button>
          <button className="logout-btn" onClick={onLogout}>Sair</button>
          <div className="header-avatar" onClick={onIrParaPerfil}>
            {fotoPerfil ? <img src={fotoPerfil} alt="Perfil" /> : gerarIniciais(apelido)}
          </div>
        </div>
      </header>

      <main className="home-page-content" style={{ padding: '40px 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="welcome-section">
          <h1>Minhas Trilhas</h1>
          <p>Olá, <strong>{apelido || 'Eleitor'}</strong>! Explore os módulos de aprendizado disponíveis na plataforma.</p>
        </div>

        <div className="trilhas-grid">
          {trilhasBanco.map((trilha) => {
            const estaInscrito = inscricoes.includes(trilha.id);
            const imagemResolvida = mapearImagemTrilha(trilha.imagem);

            return (
              <div key={trilha.id} className="trilha-card">
                <div className="trilha-card-banner">
                  {imagemResolvida ? (
                    <img src={imagemResolvida} alt={trilha.nome} className="trilha-banner-img" />
                  ) : (
                    <div className="trilha-banner-fallback" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }} />
                  )}
                </div>

                <div className="trilha-content">
                  <h3 style={{ textAlign: 'left', margin: '0 0 8px' }}>{trilha.nome}</h3>
                  <p style={{ textAlign: 'left', margin: '0 0 16px', minHeight: '42px' }}>{trilha.descricao}</p>
                  
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 600, color: '#1e40af', background: '#dbeafe', padding: '2px 8px', borderRadius: '4px', marginBottom: '16px' }}>
                      {trilha.categoria} • {trilha.nivel}
                    </span>
                  </div>

                  {estaInscrito ? (
                    <div className="actions-row">
                      <button 
                        className="action-btn" 
                        onClick={() => onVisualizarTeoria(trilha.id, trilha.nome)}
                      >
                        Teoria
                      </button>
                      <button 
                        className="action-btn" 
                        onClick={() => onVisualizarQuiz(trilha.id, trilha.nome)}
                      >
                        Quiz
                      </button>
                      <button className="action-btn" onClick={() => alert("Módulo Prático em desenvolvimento")}>Prática</button>
                    </div>
                  ) : (
                    <button className="btn-inscrever" onClick={() => handleInscrever(trilha)}>
                      Inscrever-se na Trilha
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
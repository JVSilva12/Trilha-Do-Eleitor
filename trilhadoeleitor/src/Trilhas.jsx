import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import logo from './assets/TDElogo.png';
import fotoUrna from './assets/urna.png'; 
import fotoProcesso from './assets/processo.png'; 
import fotoFakeNews from './assets/fakenews.png'; 
import './Trilhas.css';

const trilhasDados = [
  { id: 'urna', titulo: 'Urna Eletrônica', imagem: fotoUrna, descricao: 'Aprenda a utilizar a urna eletrônica de forma simples e prática.', cor: 'linear-gradient(135deg, #1e3a8a, #312e81)' },
  { id: 'processo', titulo: 'Processo Eleitoral', imagem: fotoProcesso, descricao: 'Aprenda como funciona o processo eleitoral em território brasileiro.', cor: 'linear-gradient(135deg, #0f172a, #1e293b)' },
  { id: 'fakenews', titulo: 'Combate às Fake News', imagem: fotoFakeNews, descricao: 'Aprenda a identificar notícias falsas e saiba como combatê-las.', cor: 'linear-gradient(135deg, #4c1d95, #6d28d9)' },
];

// Definição da URL Base padronizada para evitar falhas de rede no Axios
const API_URL = "http://127.0.0.1:8000";

export default function Trilhas({ emailUsuario, onLogout, onIrParaPerfil, onIrParaPainel }) {
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [apelido, setApelido] = useState('');
  const [inscricoes, setInscricoes] = useState([]);
  const [tipoUsuario, setTipoUsuario] = useState('leitor'); 

  // Função encapsulada com useCallback para evitar re-renderizações e loops infinitos
  const carregarDadosDoServidor = useCallback(async () => {
    if (!emailUsuario) return;
    try {
      // Busca os dados do perfil atualizados do backend
      const resPerfil = await axios.get(`${API_URL}/perfil/${emailUsuario}`);
      setApelido(resPerfil.data.apelido);
      setTipoUsuario(resPerfil.data.tipo_usuario || 'leitor');
      
      if (resPerfil.data.foto_perfil) {
        setFotoPerfil(`${API_URL}${resPerfil.data.foto_perfil}`);
      } else {
        setFotoPerfil(null);
      }
      
      // Busca a lista de IDs das trilhas em que o usuário está inscrito
      const resInscricoes = await axios.get(`${API_URL}/inscricoes/${emailUsuario}`);
      setInscricoes(resInscricoes.data);
    } catch (error) { 
      console.error("Erro ao sincronizar dados:", error); 
    }
  }, [emailUsuario]);

  // Carga inicial estruturada
  useEffect(() => {
    carregarDadosDoServidor();
  }, [carregarDadosDoServidor]);

  // Polling em segundo plano isolado e seguro contra múltiplos cliques
  useEffect(() => {
    if (tipoUsuario !== 'pendente') return;

    const intervalo = setInterval(() => {
      carregarDadosDoServidor();
    }, 4000); // Checa a cada 4 segundos de forma silenciosa

    return () => clearInterval(intervalo);
  }, [tipoUsuario, carregarDadosDoServidor]);

  const handleSolicitarConteudista = async () => {
    try {
      const urlCompleta = `${API_URL}/perfil/${emailUsuario}/solicitar-conteudista`;
      const response = await axios.post(urlCompleta);
      alert(response.data.message);
      setTipoUsuario('pendente'); // Bloqueia o botão na interface imediatamente
    } catch (error) {
      alert("Erro: " + (error.response?.data?.detail || "Erro de conexão/rede"));
    }
  };

  const handleInscrever = async (trilha) => {
    const confirmar = window.confirm(`Deseja realmente se inscrever na trilha: ${trilha.titulo}?`);
    if (confirmar) {
      try {
        await axios.post(`${API_URL}/inscrever?email=${emailUsuario}&trilha_id=${trilha.id}`);
        setInscricoes([...inscricoes, trilha.id]);
        alert("Inscrição realizada com sucesso!");
      } catch (error) {
        alert("Erro ao realizar inscrição.");
      }
    }
  };

  const gerarIniciais = (nome) => nome ? nome.substring(0, 2).toUpperCase() : "U";

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-logo"><img src={logo} alt="TDE Logo" /></div>
        <div className="header-actions">
          
          {/* Interface do botão baseada no estado síncrono do tipoUsuario */}
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

      <main className="home-main">
        <div className="welcome-section">
          <h1>Minhas Trilhas</h1>
          <p>Olá, <strong>{apelido}</strong>! Explore os conteúdos disponíveis.</p>
        </div>

        <div className="trilhas-grid">
          {trilhasDados.map((trilha) => {
            const estaInscrito = inscricoes.includes(trilha.id);
            return (
              <div key={trilha.id} className="trilha-card">
                <div className="trilha-card-banner">
                  {trilha.imagem ? (
                    <img src={trilha.imagem} alt={trilha.titulo} className="trilha-banner-img" />
                  ) : (
                    <div className="trilha-banner-fallback" style={{ background: trilha.cor }} />
                  )}
                </div>

                <div className="trilha-content">
                  <h3>{trilha.titulo}</h3>
                  <p>{trilha.descricao}</p>
                  
                  {estaInscrito ? (
                    <div className="actions-row">
                      <button className="action-btn">Teoria</button>
                      <button className="action-btn">Quiz</button>
                      <button className="action-btn">Prática</button>
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
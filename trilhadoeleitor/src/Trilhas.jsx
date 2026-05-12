import React, { useState, useEffect } from 'react';
import axios from 'axios';
import logo from './assets/TDElogo.png';
import fotoUrna from './assets/urna.png';
import fotoProcesso from './assets/processo.png';
import fotoFakeNews from './assets/fakenews.png'; 
import './Trilhas.css';

const trilhasDados = [
  { 
    id: 'urna', 
    titulo: 'Urna Eletrônica', 
    imagem: fotoUrna, 
    descricao: 'Aprenda a utilizar a urna eletrônica de forma simples e prática.', 
    cor: 'linear-gradient(135deg, #1e3a8a, #312e81)' 
  },
  { 
    id: 'processo', 
    titulo: 'Processo Eleitoral', 
    imagem: fotoProcesso,
    descricao: 'Aprenda como funciona o processo eleitoral em território brasileiro.', 
    cor: 'linear-gradient(135deg, #0f172a, #1e293b)' 
  },
  { 
    id: 'fakenews', 
    titulo: 'Combate às Fake News', 
    imagem: fotoFakeNews, 
    descricao: 'Aprenda a identificar notícias falsas e saiba como combatê-las.', 
    cor: 'linear-gradient(135deg, #4c1d95, #6d28d9)' 
  },
];

export default function Trilhas({ emailUsuario, onLogout, onIrParaPerfil }) {
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [apelido, setApelido] = useState('');
  const [inscricoes, setInscricoes] = useState([]);

  useEffect(() => {
    async function carregarDados() {
      if (!emailUsuario) return;
      try {
        const resPerfil = await axios.get(`http://localhost:8000/perfil/${emailUsuario}`);
        setApelido(resPerfil.data.apelido);
        if (resPerfil.data.foto_perfil) setFotoPerfil(`http://localhost:8000${resPerfil.data.foto_perfil}`);
        
        const resInscricoes = await axios.get(`http://localhost:8000/inscricoes/${emailUsuario}`);
        setInscricoes(resInscricoes.data);
      } catch (error) { console.error("Erro ao carregar dados", error); }
    }
    carregarDados();
  }, [emailUsuario]);

  const handleInscrever = async (trilha) => {
    const confirmar = window.confirm(`Deseja realmente se inscrever na trilha: ${trilha.titulo}?`);
    if (confirmar) {
      try {
        await axios.post(`http://localhost:8000/inscrever?email=${emailUsuario}&trilha_id=${trilha.id}`);
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
          <button className="conteudista-btn">Tornar-se Conteudista</button>
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
                {/* Cabeçalho do Card com Imagem ou Gradiente */}
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
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeftIcon, BookOpenIcon } from './Icons';
import './VisualizarTeoria.css';

// Definição global da URL Base para blindar requisições do Axios
const API_URL = "http://127.0.0.1:8000";

export default function VisualizarTeoria({ trilhaId, trilhaNome, onVoltar }) {
  const [aula, setAula] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    async function obterConteudo() {
      if (!trilhaId) return;
      try {
        setCarregando(true);
        setErro(false);
        // Faz a busca na rota adaptada para a estrutura de blocos dinâmicos
        const response = await axios.get(`${API_URL}/trilhas/${trilhaId}/teoria`);
        setAula(response.data);
      } catch (err) {
        console.error("Erro ao carregar teoria:", err);
        setErro(true);
      } finally {
        setCarregando(false);
      }
    }
    obterConteudo();
  }, [trilhaId]);

  return (
    <div className="teoria-page">
      <header className="teoria-header">
        <div className="header-left">
          <button className="icon-button" onClick={onVoltar} title="Voltar para Trilhas">
            <ArrowLeftIcon />
          </button>
          <div className="header-titles">
            <h1 className="header-title">{trilhaNome}</h1>
            <p className="header-subtitle">Fluxo de Estudos Sequencial</p>
          </div>
        </div>
      </header>

      <main className="teoria-main">
        {carregando && (
          <div className="teoria-card estado-info">
            <p>Carregando o material didático do servidor...</p>
          </div>
        )}

        {erro && !carregando && (
          <div className="teoria-card estado-info">
            <h3 style={{ color: '#64748b', margin: '0 0 8px 0' }}>📚 Aula em Construção</h3>
            <p style={{ margin: 0 }}>O Conteudista responsável ainda não publicou o texto teórico para este módulo. Retorne em breve!</p>
            <button className="btn-primary" onClick={onVoltar} style={{ marginTop: '16px', maxWidth: '150px' }}>Voltar</button>
          </div>
        )}

        {aula && !carregando && (
          <article className="teoria-card">
            <h2 className="aula-titulo"><BookOpenIcon /> {aula.titulo}</h2>
            
            {/* PROCESSADOR DINÂMICO DE SEQUÊNCIA DE BLOCOS INTERCALADOS */}
            <div className="aula-corpo" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {aula.blocos && aula.blocos.map((bloco, idx) => {
                
                // Renderização de blocos do tipo TEXTO
                if (bloco.tipo === 'texto') {
                  return (
                    <div key={idx} style={{ color: '#334155', fontSize: '15px', lineheight: '1.7', textAlign: 'left' }}>
                      {bloco.valor.split('\n').map((p, i) => (
                        <p key={i} style={{ margin: '0 0 12px 0' }}>{p}</p>
                      ))}
                    </div>
                  );
                }
                
                // Renderização de blocos do tipo IMAGEM
                if (bloco.tipo === 'imagem') {
                  return (
                    <div key={idx} className="aula-imagem-box" style={{ margin: '10px 0', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      <img src={bloco.valor} alt={`Elemento ilustrativo ${idx + 1}`} style={{ width: '100%', display: 'block' }} />
                    </div>
                  );
                }
                
                // Renderização de blocos do tipo VÍDEO
                if (bloco.tipo === 'video') {
                  return (
                    <div key={idx} className="aula-video-section" style={{ margin: '10px 0', padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'left' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#1e293b' }}>🎥 Recurso de Apoio Conectado</h4>
                      <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b' }}>Assista ao material de apoio sugerido pelo conteudista:</p>
                      <a 
                        href={bloco.valor} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn-outline btn-video" 
                        style={{ display: 'inline-flex', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', textDecoration: 'none', color: '#1e3a8a', border: '1px solid #1e3a8a', background: '#fff' }}
                      >
                        Abrir Link do Vídeo Auxiliar {idx + 1} ↗
                      </a>
                    </div>
                  );
                }
                
                return null;
              })}
            </div>

            <div className="actions-row" style={{ marginTop: '30px' }}>
              <button className="btn-primary" onClick={onVoltar} style={{ width: '100%' }}>Concluir Leitura e Voltar</button>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
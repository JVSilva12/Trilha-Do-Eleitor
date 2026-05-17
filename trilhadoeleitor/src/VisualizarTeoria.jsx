import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeftIcon, BookOpenIcon, FileTextIcon } from './Icons';
import './VisualizarTeoria.css';

// Definição global da URL Base para blindar requisições do Axios
const API_URL = "http://127.0.0.1:8000";

// Converte qualquer URL do YouTube ou Vimeo para URL de embed
const getEmbedUrl = (url) => {
  try {
    // YouTube padrão: youtube.com/watch?v=ID
    const ytMatch = url.match(/youtube\.com\/watch\?(?:.*&)?v=([\w-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

    // YouTube curto: youtu.be/ID
    const ytShortMatch = url.match(/youtu\.be\/([\w-]+)/);
    if (ytShortMatch) return `https://www.youtube.com/embed/${ytShortMatch[1]}`;

    // YouTube Shorts: youtube.com/shorts/ID
    const ytShortsMatch = url.match(/youtube\.com\/shorts\/([\w-]+)/);
    if (ytShortsMatch) return `https://www.youtube.com/embed/${ytShortsMatch[1]}`;

    // Vimeo: vimeo.com/ID
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    return null; // URL não reconhecida — cai no fallback de link externo
  } catch {
    return null;
  }
};

export default function VisualizarTeoria({ trilhaId, trilhaNome, onVoltar, emailUsuario }) {
  // Controle de estado para navegação interna de capítulos
  const [modulos, setModulos] = useState([]); // Guarda a lista de sumário das aulas
  const [moduloSelecionado, setModuloSelecionado] = useState(null); // Guarda a aula aberta no momento
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  // Efeito 1: Busca o sumário completo de capítulos associados a esta trilha no banco
  useEffect(() => {
    async function obterListaModulos() {
      if (!trilhaId) return;
      try {
        setCarregando(true);
        setErro(false);
        const response = await axios.get(`${API_URL}/trilhas/${trilhaId}/modulos`);
        setModulos(response.data);
      } catch (err) {
        console.error("Erro ao listar sumário de módulos:", err);
        setErro(true);
      } finally {
        setCarregando(false);
      }
    }
    obterListaModulos();
  }, [trilhaId]);

  // Efeito 2: Carrega a sequência de blocos de mídias do capítulo que o aluno clicou
  const handleCarregarModuloEspecifico = async (moduloId) => {
    try {
      setCarregando(true);
      const response = await axios.get(`${API_URL}/modulos/${moduloId}`);
      setModuloSelecionado(response.data);
    } catch (err) {
      alert("Erro ao abrir os blocos didáticos deste capítulo.");
    } finally {
      setCarregando(false);
    }
  };

  // Registra a conclusão do capítulo no banco antes de voltar para o sumário
  const handleRetornarAoSumario = async () => {
    if (moduloSelecionado && moduloSelecionado.id && emailUsuario) {
      try {
        // Dispara a rota do FastAPI para computar a leitura do módulo atual
        await axios.post(`${API_URL}/trilhas/${trilhaId}/concluir-modulo/${moduloSelecionado.id}?email=${emailUsuario}`);
      } catch (err) {
        console.error("Erro ao registrar conclusão do módulo no backend:", err);
      }
    }
    // Reseta o estado para voltar a exibir o menu do sumário
    setModuloSelecionado(null);
    setCarregando(false);
  };

  return (
    <div className="teoria-page">
      <header className="teoria-header">
        <div className="header-left">
          {/* Se estiver lendo um módulo, volta pro sumário. Se estiver no sumário, volta pra home */}
          <button
            className="icon-button"
            onClick={moduloSelecionado ? handleRetornarAoSumario : onVoltar}
            title={moduloSelecionado ? "Voltar para o sumário" : "Voltar para as trilhas"}
          >
            <ArrowLeftIcon />
          </button>
          <div className="header-titles">
            <h1 className="header-title">{trilhaNome}</h1>
            <p className="header-subtitle">
              {moduloSelecionado ? `Lendo: ${moduloSelecionado.titulo}` : "Sumário de Conteúdos Teóricos"}
            </p>
          </div>
        </div>
      </header>

      <main className="teoria-main">
        {carregando && (
          <div className="teoria-card estado-info">
            <p>Carregando dados do servidor de banco de dados...</p>
          </div>
        )}

        {/* =========================================================================
           ESTÁGIO 1: EXIBE A LISTA DE CAPÍTULOS DISPONÍVEIS (SUMÁRIO)
           ========================================================================= */}
        {!moduloSelecionado && !carregando && (
          <>
            {modulos.length === 0 || erro ? (
              <div className="teoria-card estado-info">
                <h3 style={{ color: '#64748b', margin: '0 0 8px 0' }}>📚 Trilhas em Construção</h3>
                <p style={{ margin: 0 }}>Nenhum módulo ou capítulo teórico foi publicado para esta trilha ainda. Retorne mais tarde!</p>
                <button className="btn-primary" onClick={onVoltar} style={{ marginTop: '16px', maxWidth: '150px' }}>Voltar</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                <p style={{ textAlign: 'left', color: '#64748b', fontSize: '14px', margin: '0 0 6px 0' }}>
                  Selecione um dos capítulos abaixo para iniciar seus estudos textuais e audiovisuais:
                </p>
                {modulos.map((mod, idx) => (
                  <div
                    key={mod.id}
                    className="perfil-card"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => handleCarregarModuloEspecifico(mod.id)}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: '#1e3a8a' }}>
                        Capítulo {idx + 1}: {mod.titulo}
                      </h4>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {mod.blocos.length} seções intercaladas de conteúdo
                      </span>
                    </div>
                    <button className="nav-btn" style={{ padding: '6px 14px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontWeight: 600 }}>
                      Acessar Aula
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* =========================================================================
           ESTÁGIO 2: EXIBE O LEITOR DE BLOCOS INTERCALADOS DO MÓDULO SELECIONADO
           ========================================================================= */}
        {moduloSelecionado && !carregando && (
          <article className="teoria-card">
            <h2 className="aula-titulo"><BookOpenIcon /> {moduloSelecionado.titulo}</h2>

            <div className="aula-corpo" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {moduloSelecionado.blocos && moduloSelecionado.blocos.map((bloco, idx) => {

                // Renderização estruturada de blocos do tipo TEXTO
                if (bloco.tipo === 'texto') {
                  return (
                    <div key={idx} style={{ color: '#334155', fontSize: '15px', lineHeight: '1.7', textAlign: 'left' }}>
                      {bloco.valor.split('\n').map((p, i) => (
                        <p key={i} style={{ margin: '0 0 12px 0' }}>{p}</p>
                      ))}
                    </div>
                  );
                }

                if (bloco.tipo === 'imagem') {
                  return (
                    <div key={idx} className="aula-imagem-box" style={{ margin: '10px 0', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                      <img
                        src={bloco.valor}
                        alt={`Elemento visual da lição ${idx + 1}`}
                        style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                      />
                    </div>
                  );
                }

                if (bloco.tipo === 'video') {
                  const embedUrl = getEmbedUrl(bloco.valor);

                  return (
                    <div key={idx} className="aula-video-section" style={{ margin: '10px 0', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      {embedUrl ? (
                        <iframe
                          src={embedUrl}
                          title={`Vídeo da aula ${idx + 1}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ width: '100%', aspectRatio: '16/9', display: 'block', border: 'none' }}
                        />
                      ) : (
                        // Fallback para URLs não reconhecidas (não são YouTube nem Vimeo)
                        <div style={{ padding: '16px', textAlign: 'left' }}>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#1e293b' }}>
                            <FileTextIcon style={{ width: '16px', height: '16px', display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                            Recurso de Apoio Conectado
                          </h4>
                          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b' }}>Assista ao material complementar sugerido pelo conteudista:</p>
                          <a
                            href={bloco.valor}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-outline btn-video"
                            style={{ display: 'inline-flex', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', textDecoration: 'none', color: '#1e3a8a', border: '1px solid #1e3a8a', background: '#fff', fontWeight: 600 }}
                          >
                            Abrir Link do Vídeo Auxiliar {idx + 1} ↗
                          </a>
                        </div>
                      )}
                    </div>
                  );
                }

                return null;
              })}
            </div>

            <div className="actions-row" style={{ marginTop: '30px' }}>
              <button className="btn-primary" onClick={handleRetornarAoSumario} style={{ width: '100%' }}>
                Concluir Capítulo e Voltar ao Sumário
              </button>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
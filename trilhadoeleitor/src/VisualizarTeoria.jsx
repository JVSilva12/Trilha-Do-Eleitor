import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ArrowLeftIcon, BookOpenIcon, FileTextIcon } from './Icons';
import './VisualizarTeoria.css';

const API_URL = "http://127.0.0.1:1234";

// Converte qualquer URL do YouTube ou Vimeo para URL de embed.
// Para YouTube, adiciona ?enablejsapi=1 para detecção de eventos via postMessage.
const getEmbedUrl = (url) => {
  try {
    const ytMatch = url.match(/youtube\.com\/watch\?(?:.*&)?v=([\w-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?enablejsapi=1`;

    const ytShortMatch = url.match(/youtu\.be\/([\w-]+)/);
    if (ytShortMatch) return `https://www.youtube.com/embed/${ytShortMatch[1]}?enablejsapi=1`;

    const ytShortsMatch = url.match(/youtube\.com\/shorts\/([\w-]+)/);
    if (ytShortsMatch) return `https://www.youtube.com/embed/${ytShortsMatch[1]}?enablejsapi=1`;

    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    return null;
  } catch {
    return null;
  }
};

function VideoComControleAudio({ src, titulo, audioFundo, pausadoPorVideo }) {
  const [overlayAtivo, setOverlayAtivo] = useState(true);

  const handleCliqueNoOverlay = () => {
    const audio = audioFundo?.current;
    if (audio && !audio.paused) {
      audio.pause();
      pausadoPorVideo.current = true;
    }
    // Remove o overlay para liberar os controles do player
    setOverlayAtivo(false);
  };

  // Reativa o overlay se o usuário pausar o vídeo (via postMessage do YouTube)
  // para garantir que um novo clique de play seja interceptado novamente
  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.origin.includes('youtube.com')) return;
      try {
        const data = JSON.parse(event.data);
        // playerState 2 = pausado, 0 = encerrado → reativa o overlay
        if (data.info?.playerState === 2 || data.info?.playerState === 0) {
          setOverlayAtivo(true);
          const audio = audioFundo?.current;
          if (audio && pausadoPorVideo.current) {
            audio.play().catch(() => {});
            pausadoPorVideo.current = false;
          }
        }
      } catch { /* ignora mensagens não-JSON */ }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [audioFundo, pausadoPorVideo]);

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
      <iframe
        src={src}
        title={titulo}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ width: '100%', height: '100%', display: 'block', border: 'none' }}
      />
      {/* Overlay invisível que captura o clique antes do vídeo tocar */}
      {overlayAtivo && (
        <div
          onClick={handleCliqueNoOverlay}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            cursor: 'pointer',
            background: 'transparent',
          }}
          title="Clique para reproduzir o vídeo"
        />
      )}
    </div>
  );
}

export default function VisualizarTeoria({ trilhaId, trilhaNome, onVoltar, emailUsuario, audioFundo }) {
  const [modulos, setModulos] = useState([]);
  const [modulosLidos, setModulosLidos] = useState(new Set());
  const [moduloSelecionado, setModuloSelecionado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  // Flag compartilhada entre os componentes de vídeo e os listeners globais
  const pausadoPorVideo = useRef(false);

  // Retoma a música ao sair da tela de teoria (via window.focus para Vimeo)
  useEffect(() => {
    const handleWindowFocus = () => {
      const audio = audioFundo?.current;
      if (audio && pausadoPorVideo.current) {
        audio.play().catch(() => {});
        pausadoPorVideo.current = false;
      }
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      // Garante que a música retoma ao desmontar (navegar para outra tela)
      const audio = audioFundo?.current;
      if (audio && pausadoPorVideo.current) {
        audio.play().catch(() => {});
        pausadoPorVideo.current = false;
      }
    };
  }, [audioFundo]);

  // Busca o sumário de módulos da trilha
  useEffect(() => {
    async function obterListaModulos() {
      if (!trilhaId) return;
      try {
        setCarregando(true);
        setErro(false);
        const [resModulos, resProgresso] = await Promise.all([
          axios.get(`${API_URL}/trilhas/${trilhaId}/modulos`),
          emailUsuario
            ? axios.get(`${API_URL}/trilhas/${trilhaId}/progresso/${emailUsuario}`).catch(() => ({ data: { concluidos_ids: [] } }))
            : Promise.resolve({ data: { concluidos_ids: [] } })
        ]);
        // Filtra apenas módulos de tipo 'teoria'
        const modulosTeoria = resModulos.data.filter(mod => mod.tipo_conteudo === 'teoria' || !mod.tipo_conteudo);
        setModulos(modulosTeoria);
        // O endpoint de progresso retorna concluidos_ids (lista de IDs lidos pelo usuário)
        const ids = resProgresso.data.concluidos_ids || [];
        setModulosLidos(new Set(ids));
      } catch (err) {
        console.error("Erro ao listar sumário de módulos:", err);
        setErro(true);
      } finally {
        setCarregando(false);
      }
    }
    obterListaModulos();
  }, [trilhaId]);


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

  const handleRetornarAoSumario = async () => {
    if (moduloSelecionado && moduloSelecionado.id && emailUsuario) {
      try {
        await axios.post(`${API_URL}/trilhas/${trilhaId}/concluir-modulo/${moduloSelecionado.id}?email=${emailUsuario}`);
        // Marca o módulo como lido localmente para atualizar os ícones imediatamente
        setModulosLidos(prev => new Set([...prev, moduloSelecionado.id]));
      } catch (err) {
        console.error("Erro ao registrar conclusão do módulo no backend:", err);
      }
    }
    setModuloSelecionado(null);
    setCarregando(false);
  };

  return (
    <div className="teoria-page">
      <header className="teoria-header">
        <div className="header-left">
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

        {/* ESTÁGIO 1: SUMÁRIO DE CAPÍTULOS */}
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
                {modulos.map((mod, idx) => {
                  const foiLido = modulosLidos.has(mod.id);
                  return (
                    <div
                      key={mod.id}
                      className="perfil-card"
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s',
                        background: foiLido ? '#f0fdf4' : '#fff',
                        border: foiLido ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
                      }}
                      onClick={() => handleCarregarModuloEspecifico(mod.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {/* Ícone de status de leitura */}
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: foiLido ? '#22c55e' : '#fee2e2',
                          fontSize: '16px', fontWeight: 700,
                          color: foiLido ? '#fff' : '#ef4444',
                          boxShadow: foiLido ? '0 0 0 3px #dcfce7' : '0 0 0 3px #fee2e2'
                        }}>
                          {foiLido ? '✓' : '✕'}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <h4 style={{ margin: '0 0 3px 0', fontSize: '15px', fontWeight: 700, color: '#1e3a8a' }}>
                            Capítulo {idx + 1}: {mod.titulo}
                          </h4>
                          <span style={{ fontSize: '12px', color: foiLido ? '#16a34a' : '#64748b', fontWeight: foiLido ? 600 : 400 }}>
                            {foiLido ? '✓ Capítulo concluído' : `${mod.blocos.length} seções intercaladas de conteúdo`}
                          </span>
                        </div>
                      </div>
                      <button
                        className="nav-btn"
                        style={{
                          padding: '6px 14px', fontWeight: 600, whiteSpace: 'nowrap',
                          background: foiLido ? '#dcfce7' : '#eff6ff',
                          color: foiLido ? '#15803d' : '#2563eb',
                          border: foiLido ? '1px solid #86efac' : '1px solid #bfdbfe'
                        }}
                      >
                        {foiLido ? 'Reler' : 'Acessar Aula'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ESTÁGIO 2: LEITOR DE BLOCOS DO MÓDULO */}
        {moduloSelecionado && !carregando && (
          <article className="teoria-card">
            <h2 className="aula-titulo"><BookOpenIcon /> {moduloSelecionado.titulo}</h2>

            <div className="aula-corpo" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {moduloSelecionado.blocos && moduloSelecionado.blocos.map((bloco, idx) => {

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
                        <VideoComControleAudio
                          src={embedUrl}
                          titulo={`Vídeo da aula ${idx + 1}`}
                          audioFundo={audioFundo}
                          pausadoPorVideo={pausadoPorVideo}
                        />
                      ) : (
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
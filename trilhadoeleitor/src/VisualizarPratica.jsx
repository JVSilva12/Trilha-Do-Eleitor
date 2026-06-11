import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { ArrowLeftIcon, BookOpenIcon } from './Icons';
import JogoFakeNews from './JogoFakeNews';
import AtividadeEleicoes from './AtividadeEleicoes';
import './VisualizarTeoria.css';

const API_URL = "http://127.0.0.1:1234";

export default function VisualizarPratica({ trilhaId, trilhaNome, onVoltar, audioFundo }) {
  const [modulos, setModulos] = useState([]);
  const [moduloSelecionado, setModuloSelecionado] = useState(null);
  const [noticiasJogo, setNoticiasJogo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  // Flag compartilhada entre os componentes de vídeo e os listeners globais
  const pausadoPorVideo = useRef(false);

  // Retoma a música ao sair da tela de prática
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
      const audio = audioFundo?.current;
      if (audio && pausadoPorVideo.current) {
        audio.play().catch(() => {});
        pausadoPorVideo.current = false;
      }
    };
  }, [audioFundo]);

  const handleCarregarModuloEspecifico = useCallback(async (moduloId) => {
    try {
      setCarregando(true);
      const response = await axios.get(`${API_URL}/modulos/${moduloId}`);
      setModuloSelecionado(response.data);

      // Verifica se o módulo tem um bloco do tipo 'jogo' e carrega as notícias
      if (response.data.blocos && response.data.blocos.some(bloco => bloco.tipo === 'jogo')) {
        try {
          const noticiasResponse = await axios.get(`${API_URL}/modulos/${moduloId}/noticias-jogo`);
          const noticiasFormatadas = noticiasResponse.data.map(noticia => ({
            id: noticia.id,
            image: noticia.imagem,
            isFact: noticia.eh_fato === 1,
            explanation: noticia.explicacao
          }));
          setNoticiasJogo(noticiasFormatadas.length > 0 ? noticiasFormatadas : null);
        } catch (err) {
          console.error("Erro ao carregar notícias do jogo:", err);
          setNoticiasJogo(null);
        }
      }
    } catch (err) {
      alert("Erro ao abrir a atividade de prática.");
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Busca os módulos de prática da trilha
  useEffect(() => {
    async function obterListaModulos() {
      if (!trilhaId) return;
      try {
        setCarregando(true);
        setErro(false);
        const resModulos = await axios.get(`${API_URL}/trilhas/${trilhaId}/modulos`);
        // Filtra apenas módulos do tipo 'pratica'
        const modulosPratica = resModulos.data.filter(mod => mod.tipo_conteudo === 'pratica' || !mod.tipo_conteudo);
        setModulos(modulosPratica);
      } catch (err) {
        console.error("Erro ao listar módulos de prática:", err);
        setErro(true);
        setCarregando(false);
      }
    }
    obterListaModulos();
  }, [trilhaId]);

  // Se houver apenas 1 módulo, carrega automaticamente
  useEffect(() => {
    if (modulos.length === 1 && !moduloSelecionado) {
      handleCarregarModuloEspecifico(modulos[0].id);
    } else if (modulos.length > 0) {
      setCarregando(false);
    }
  }, [modulos, moduloSelecionado, handleCarregarModuloEspecifico]);

  const handleRetornarAoSumario = () => {
    setModuloSelecionado(null);
    setNoticiasJogo(null);
    setCarregando(false);
  };

  return (
    <>
      {moduloSelecionado && moduloSelecionado.blocos && (moduloSelecionado.blocos.some(b => b.tipo === 'cargos' || b.tipo === 'eleicoes') || moduloSelecionado.blocos.some(b => b.tipo === 'jogo')) ? (
        // Para AtividadeEleicoes e JogoFakeNews, ocupa página inteira
        <>
          {moduloSelecionado.blocos && moduloSelecionado.blocos.map((bloco, idx) => {
            if (bloco.tipo === 'cargos' || bloco.tipo === 'eleicoes') {
              return (
                <AtividadeEleicoes 
                  key={idx}
                  onVoltar={onVoltar}
                  showHeader={true}
                />
              );
            }
            
            if (bloco.tipo === 'jogo') {
              return (
                <div key={idx} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                  <header style={{ padding: '16px 6vw', background: 'radial-gradient(circle at top left, #fef3c7 0%, #f8fafc 45%, #ecfeff 100%)', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                      onClick={onVoltar}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '8px' }}
                      title="Voltar para as trilhas"
                    >
                      ←
                    </button>
                    <div>
                      <h1 style={{ margin: '0', fontSize: '24px', fontWeight: 700 }}>{trilhaNome}</h1>
                      <p style={{ margin: '0', color: '#475569', fontSize: '14px' }}>Atividade Prática: {moduloSelecionado.titulo}</p>
                    </div>
                  </header>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 6vw', background: 'radial-gradient(circle at top left, #fef3c7 0%, #f8fafc 45%, #ecfeff 100%)' }}>
                    <JogoFakeNews 
                      newsData={noticiasJogo}
                      titulo="Detetive da Informação"
                      descricao="Teste suas habilidades: arraste a notícia e descubra se é verdadeira ou falsa."
                    />
                  </div>
                </div>
              );
            }
            
            return null;
          })}
        </>
      ) : (
        // Para outras atividades, mantém layout original
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
                  {moduloSelecionado ? `Atividade Prática: ${moduloSelecionado.titulo}` : "Sumário de Atividades Práticas"}
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

            {/* ESTÁGIO 1: SUMÁRIO DE ATIVIDADES */}
            {!moduloSelecionado && !carregando && (
              <>
                {modulos.length === 0 || erro ? (
                  <div className="teoria-card estado-info">
                    <h3 style={{ color: '#64748b', margin: '0 0 8px 0' }}>🎮 Atividades em Construção</h3>
                    <p style={{ margin: 0 }}>Nenhuma atividade prática foi publicada para esta trilha ainda. Retorne mais tarde!</p>
                    <button className="btn-primary" onClick={onVoltar} style={{ marginTop: '16px', maxWidth: '150px' }}>Voltar</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                    <p style={{ textAlign: 'left', color: '#64748b', fontSize: '14px', margin: '0 0 6px 0' }}>
                      Selecione uma das atividades abaixo para praticar:
                    </p>
                    {modulos.map((mod, idx) => (
                      <div
                        key={mod.id}
                        className="perfil-card"
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s',
                          background: '#fff',
                          border: '1px solid #e2e8f0'
                        }}
                        onClick={() => handleCarregarModuloEspecifico(mod.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: '#fef3c7',
                            fontSize: '16px', fontWeight: 700,
                            color: '#d97706',
                            boxShadow: '0 0 0 3px #fef3c7'
                          }}>
                            🎮
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <h4 style={{ margin: '0 0 3px 0', fontSize: '15px', fontWeight: 700, color: '#1e3a8a' }}>
                              Atividade {idx + 1}: {mod.titulo}
                            </h4>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              Clique para iniciar
                            </span>
                          </div>
                        </div>
                        <button
                          className="nav-btn"
                          style={{
                            padding: '6px 14px', fontWeight: 600, whiteSpace: 'nowrap',
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe'
                          }}
                        >
                          Iniciar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ESTÁGIO 2: RENDERIZA OUTRAS ATIVIDADES */}
            {moduloSelecionado && !carregando && (
              <article className="teoria-card">
                <h2 className="aula-titulo"><BookOpenIcon /> {moduloSelecionado.titulo}</h2>

                <div className="aula-corpo" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {moduloSelecionado.blocos && moduloSelecionado.blocos.map((bloco, idx) => {

                    if (bloco.tipo === 'jogo') {
                      return (
                        <div key={idx} className="aula-jogo-section" style={{ margin: '20px 0', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                          <JogoFakeNews 
                            newsData={noticiasJogo}
                            titulo="Detetive da Informação"
                            descricao="Teste suas habilidades: arraste a notícia e descubra se é verdadeira ou falsa."
                          />
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>

                <div className="actions-row" style={{ marginTop: '30px' }}>
                  <button className="btn-primary" onClick={handleRetornarAoSumario} style={{ width: '100%' }}>
                    Voltar ao Sumário de Atividades
                  </button>
                </div>
              </article>
            )}
          </main>
        </div>
      )}
    </>
  );
}

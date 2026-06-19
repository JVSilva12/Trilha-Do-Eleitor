import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeftIcon, CheckIcon, TrashIcon } from './Icons';
import './VisualizarQuiz.css';
import somAplausos from './assets/aplausos.mp3';

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:1234";

export default function VisualizarQuiz({ trilhaId, trilhaNome, onVoltar }) {
  const [perguntas, setPerguntas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [alternativaSelecionada, setAlternativaSelecionada] = useState(null);
  const [respondido, setRespondido] = useState(false);
  const [pontuacao, setPontuacao] = useState(0);
  const [mostrarResultado, setMostrarResultado] = useState(false);

  useEffect(() => {
    async function obterPerguntas() {
      if (!trilhaId) return;
      try {
        setCarregando(true);
        const response = await axios.get(`${API_URL}/trilhas/${trilhaId}/quiz`);
        setPerguntas(response.data);
      } catch (err) {
        console.error("Erro ao carregar o quiz:", err);
      } finally {
        setCarregando(false);
      }
    }
    obterPerguntas();
  }, [trilhaId]);

  useEffect(() => {
    if (mostrarResultado && pontuacao === perguntas.length && perguntas.length > 0) {
      const aplausos = new Audio(somAplausos);
      aplausos.volume = 0.8;
      aplausos.play().catch(() => {});
    }
  }, [mostrarResultado, pontuacao, perguntas.length]);

  const handleResponder = () => {
    if (!alternativaSelecionada || respondido) return;

    const questaoAtual = perguntas[indiceAtual];
    if (alternativaSelecionada === questaoAtual.resposta_correta) {
      setPontuacao(pontuacao + 1);
    }
    setRespondido(true);
  };

  const handleProxima = () => {
    setAlternativaSelecionada(null);
    setRespondido(false);

    if (indiceAtual + 1 < perguntas.length) {
      setIndiceAtual(indiceAtual + 1);
    } else {
      setMostrarResultado(true);
    }
  };

  if (carregando) {
    return (
      <div className="quiz-page"><div className="quiz-card estado-info"><p>Carregando questionário...</p></div></div>
    );
  }

  if (perguntas.length === 0) {
    return (
      <div className="quiz-page">
        <header className="quiz-header">
          <button className="icon-button" onClick={onVoltar}><ArrowLeftIcon /></button>
          <h1 className="header-title">{trilhaNome}</h1>
        </header>
        <main className="quiz-main">
          <div className="quiz-card estado-info">
            <h3>📝 Quiz em Preparação</h3>
            <p>Ainda não há perguntas cadastradas para esta trilha. Volte mais tarde!</p>
            <button className="btn-primary" onClick={onVoltar} style={{ marginTop: '20px' }}>Voltar</button>
          </div>
        </main>
      </div>
    );
  }

  const questao = perguntas[indiceAtual];

  return (
    <div className="quiz-page">
      <header className="quiz-header">
        <div className="header-left">
          <button className="icon-button" onClick={onVoltar} title="Voltar"><ArrowLeftIcon /></button>
          <div className="header-titles">
            <h1 className="header-title">{trilhaNome}</h1>
            <p className="header-subtitle">Simulado de Fixação</p>
          </div>
        </div>
      </header>

      <main className="quiz-main">
        {!mostrarResultado ? (
          <article className="quiz-card">
            {/* Barra de progresso do Quiz */}
            <div className="quiz-progresso">
              <span>Questão {indiceAtual + 1} de {perguntas.length}</span>
              <div className="quiz-barra-fundo">
                <div className="quiz-barra-preenchida" style={{ width: `${((indiceAtual + 1) / perguntas.length) * 100}%` }}></div>
              </div>
            </div>

            <h3 className="quiz-enunciado">{questao.enunciado}</h3>

            <div className="quiz-alternativas">
              {[
                { letra: 'A', texto: questao.alternativa_a },
                { letra: 'B', texto: questao.alternativa_b },
                { letra: 'C', texto: questao.alternativa_c },
                { letra: 'D', texto: questao.alternativa_d },
              ].map((alt) => {
                let classeBotao = "alternativa-btn";
                if (alternativaSelecionada === alt.letra) classeBotao += " selecionada";

                if (respondido) {
                  if (alt.letra === questao.resposta_correta) {
                    classeBotao += " correta";
                  } else if (alternativaSelecionada === alt.letra) {
                    classeBotao += " incorreta";
                  }
                  classeBotao += " travada";
                }

                return (
                  <button
                    key={alt.letra}
                    className={classeBotao}
                    onClick={() => !respondido && setAlternativaSelecionada(alt.letra)}
                    disabled={respondido}
                  >
                    <span className="alternativa-letra">{alt.letra}</span>
                    <span className="alternativa-texto">{alt.texto}</span>
                  </button>
                );
              })}
            </div>

            <div className="actions-row" style={{ marginTop: '24px' }}>
              {!respondido ? (
                <button
                  className="btn-primary"
                  disabled={!alternativaSelecionada}
                  onClick={handleResponder}
                  style={{ width: '100%', background: !alternativaSelecionada ? '#94a3b8' : '#1e3a8a' }}
                >
                  Confirmar Resposta
                </button>
              ) : (
                <button className="btn-primary btn-save" onClick={handleProxima} style={{ width: '100%' }}>
                  {indiceAtual + 1 === perguntas.length ? "Ver Resultado Final" : "Próxima Questão →"}
                </button>
              )}
            </div>
          </article>
        ) : (
          <div className="quiz-card resultado-card">
            <h2>🎉 Questionário Concluído!</h2>
            <p>Você completou a avaliação de fixação da trilha.</p>

            <div className="score-box">
              <span className="score-num">{pontuacao} / {perguntas.length}</span>
              <span className="score-text">Respostas Corretas</span>
            </div>

            <p className="feedback-score">
              {pontuacao === perguntas.length ? "Desempenho Perfeito! Você dominou o assunto." : "Bom trabalho! Continue revisando para fixar ainda mais."}
            </p>

            <button className="btn-primary" onClick={onVoltar} style={{ width: '100%', marginTop: '16px' }}>
              Voltar para as Trilhas
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
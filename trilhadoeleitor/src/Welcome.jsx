import { useState, useEffect } from 'react';
import logo from './assets/TDElogo.png';
import './Welcome.css';

const TRILHAS = [
  {
    icon: '🗳️',
    cor: '#3b82f6',
    titulo: 'Urna Eletrônica',
    descricao: 'Simule o processo real de votação e entenda como funciona cada etapa da cabine eleitoral.',
  },
  {
    icon: '⚖️',
    cor: '#7c3aed',
    titulo: 'Processo Eleitoral',
    descricao: 'Descubra as regras, os papéis de cada envolvido e toda a dinâmica que sustenta a democracia.',
  },
  {
    icon: '🔍',
    cor: '#6d3ad6',
    titulo: 'Fake News',
    descricao: 'Aprenda a identificar desinformação com casos reais simulados e técnicas de verificação.',
  },
];

const STATS = [
  { valor: '3', label: 'Trilhas interativas' },
  { valor: '100%', label: 'Gratuito' },
  { valor: '∞', label: 'Conhecimento cívico' },
];

export default function Welcome({ onEntrar }) {
  const [visivel, setVisivel] = useState(false);
  const [cardAtivo, setCardAtivo] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setVisivel(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`wlc-root${visivel ? ' wlc-visible' : ''}`}>

      {/* Fundo decorativo com orbes */}
      <div className="wlc-bg">
        <div className="wlc-orb wlc-orb-1" />
        <div className="wlc-orb wlc-orb-2" />
        <div className="wlc-orb wlc-orb-3" />
        <div className="wlc-grid" />
      </div>

      {/* ——— HERO ——— */}
      <header className="wlc-hero">

        <div className="wlc-badge">
          <span className="wlc-badge-dot" />
          Plataforma de educação eleitoral
        </div>

        <div className="wlc-logo-wrap">
          <img src={logo} alt="Logo Trilha do Eleitor" className="wlc-logo-img" />
        </div>

        <h1 className="wlc-title">
          <span className="wlc-title-main">Trilha do</span>
          <span className="wlc-title-accent">Eleitor</span>
        </h1>

        <p className="wlc-subtitle">
          Uma jornada interativa sobre as eleições no Brasil <br />
          Aprenda, explore e vote com consciência
        </p>

        <div className="wlc-hero-actions">
          <button className="wlc-btn-primary" onClick={onEntrar}>
            <span>Começar agora</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <a href="#sobre" className="wlc-btn-ghost">Saiba mais</a>
        </div>

        {/* Stats rápidos */}
        <div className="wlc-stats">
          {STATS.map((s) => (
            <div key={s.label} className="wlc-stat">
              <strong>{s.valor}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </header>

      {/* ——— SOBRE ——— */}
      <section className="wlc-section wlc-sobre" id="sobre">
        <div className="wlc-section-inner">
          <p className="wlc-eyebrow">O que é a plataforma?</p>
          <h2 className="wlc-section-title">
            Mais do que teoria,<br />experiência real
          </h2>
          <p className="wlc-section-body">
            O <strong>Trilha do Eleitor</strong> foi criado para transformar a educação cívica 
            em algo prático e acessível. Milhões de brasileiros nunca tiveram contato real 
            com o processo eleitoral e são vulneráveis à desinformação. Nossa plataforma 
            muda isso: você aprende lendo, testando e <em>simulando</em>.
          </p>

          <div className="wlc-pilares">
            {[
              { icon: '📚', texto: 'Teoria clara e objetiva' },
              { icon: '🧠', texto: 'Quizzes para fixar o conteúdo' },
              { icon: '🎮', texto: 'Simulações interativas reais' },
              { icon: '🏆', texto: 'Progresso acompanhado por trilha' },
            ].map((p) => (
              <div key={p.texto} className="wlc-pilar">
                <span className="wlc-pilar-icon">{p.icon}</span>
                <span>{p.texto}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cartão visual decorativo */}
        <div className="wlc-card-mockup">
          <div className="wlc-mockup-logo">
            <img src={logo} alt="logo" />
          </div>
          <div className="wlc-mockup-linha wlc-mockup-linha--titulo" />
          <div className="wlc-mockup-linha wlc-mockup-linha--sub" />
          <div className="wlc-mockup-barra">
            <div className="wlc-mockup-progresso" />
          </div>
          <p className="wlc-mockup-label">Seu progresso nas trilhas</p>
          <div className="wlc-mockup-tags">
            {['Urna', 'Eleições', 'Fake News'].map((t) => (
              <span key={t} className="wlc-tag">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ——— TRILHAS ——— */}
      <section className="wlc-section wlc-trilhas-section">
        <p className="wlc-eyebrow">Conteúdo padrão disponível</p>
        <h2 className="wlc-section-title wlc-center">Três trilhas, um cidadão mais preparado</h2>

        <div className="wlc-cards">
          {TRILHAS.map((t, i) => (
            <div
              key={t.titulo}
              className={`wlc-card${cardAtivo === i ? ' wlc-card--ativo' : ''}`}
              style={{ '--card-cor': t.cor }}
              onMouseEnter={() => setCardAtivo(i)}
              onMouseLeave={() => setCardAtivo(null)}
            >
              <div className="wlc-card-icon">{t.icon}</div>
              <h3 className="wlc-card-titulo">{t.titulo}</h3>
              <p className="wlc-card-desc">{t.descricao}</p>
              <div className="wlc-card-footer">
                <span className="wlc-card-tag">Teoria</span>
                <span className="wlc-card-tag">Quiz</span>
                <span className="wlc-card-tag">Prática</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ——— CTA FINAL ——— */}
      <section className="wlc-cta">
        <img src={logo} alt="logo" className="wlc-cta-logo" />
        <h2 className="wlc-cta-titulo">Pronto para começar sua trilha?</h2>
        <p className="wlc-cta-sub">
          Faça login ou crie sua conta gratuitamente e dê o primeiro passo rumo 
          a uma participação democrática mais informada.
        </p>
        <button className="wlc-btn-primary wlc-btn-large" onClick={onEntrar}>
          <span>Acessar a plataforma</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </section>

      {/* Rodapé mínimo */}
      <footer className="wlc-footer">
        <span>2026 Trilha do Eleitor · Desenvolvido por estudantes de computação</span>
      </footer>
    </div>
  );
}
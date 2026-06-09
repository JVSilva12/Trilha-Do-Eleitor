import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeftIcon, CheckIcon, EleicaoGeraisIcon, EleicaoMunicipalIcon } from './Icons';
import { getCandidatos } from './candidatos';
import brasaoImg from './assets/Brasil.png';
import somUrna from './assets/urna.mp3';
import './SimuladorUrna.css';

// =========================================================================
// CARGOS — por tipo e turno
// =========================================================================
const CARGOS_GERAIS_1T = [
  { id: 'dep_federal',  nome: 'DEPUTADO FEDERAL',  digitos: 4 },
  { id: 'dep_estadual', nome: 'DEPUTADO ESTADUAL', digitos: 5 },
  { id: 'senador_1',    nome: 'SENADOR',            digitos: 3 },
  { id: 'senador_2',    nome: 'SENADOR',            digitos: 3 },
  { id: 'governador',   nome: 'GOVERNADOR',         digitos: 2 },
  { id: 'presidente',   nome: 'PRESIDENTE',         digitos: 2 },
];

const CARGOS_GERAIS_2T = [
  { id: 'governador', nome: 'GOVERNADOR', digitos: 2 },
  { id: 'presidente', nome: 'PRESIDENTE', digitos: 2 },
];

const CARGOS_MUNICIPAL_1T = [
  { id: 'vereador', nome: 'VEREADOR', digitos: 5 },
  { id: 'prefeito', nome: 'PREFEITO', digitos: 2 },
];

const CARGOS_MUNICIPAL_2T = [
  { id: 'prefeito', nome: 'PREFEITO', digitos: 2 },
];

// =========================================================================
// RELÓGIO em tempo real
// =========================================================================
function useRelogio() {
  const formatar = (d) => {
    // Converte para o fuso de Brasília (America/Sao_Paulo) independente do SO
    const opts = { timeZone: 'America/Sao_Paulo', hour12: false };
    const partes = new Intl.DateTimeFormat('pt-BR', {
      ...opts,
      weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(d);

    const get = (tipo) => partes.find(p => p.type === tipo)?.value ?? '';
    const diasMap = { seg: 'SEG', ter: 'TER', qua: 'QUA', qui: 'QUI', sex: 'SEX', sáb: 'SÁB', dom: 'DOM' };
    const diaSemana = diasMap[get('weekday').toLowerCase().replace('.', '')] ?? get('weekday').toUpperCase();

    return `${diaSemana} ${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}:${get('second')}`;
  };
  const [hora, setHora] = useState(formatar(new Date()));
  useEffect(() => {
    const t = setInterval(() => setHora(formatar(new Date())), 1000);
    return () => clearInterval(t);
  }, []);
  return hora;
}

// =========================================================================
// ESTADO INICIAL
// =========================================================================
const INICIAL = {
  fase: 'inicio',   // 'inicio' | 'votando' | 'confirmar' | 'encerrando' | 'fim'
  cargoIdx: 0,
  digitos: [],
  branco: false,
  votos: {},
};

export default function SimuladorUrna({ onVoltar }) {
  const [tipoEleicao, setTipoEleicao] = useState(null); // null | 'gerais' | 'municipal'
  const [turno, setTurno] = useState(null); // null | 1 | 2
  const [estado, setEstado] = useState(INICIAL);
  const [barraProgresso, setBarraProgresso] = useState(0);
  const [subFase, setSubFase] = useState('barra');
  const [folhetoAberto, setFolhetoAberto] = useState(false);
  const [dragStartY, setDragStartY] = useState(null);
  const [dragging, setDragging] = useState(false);
  const hora = useRelogio();
  const barraRef = useRef(null);

  const CARGOS =
    tipoEleicao === 'municipal'
      ? (turno === 2 ? CARGOS_MUNICIPAL_2T : CARGOS_MUNICIPAL_1T)
      : (turno === 2 ? CARGOS_GERAIS_2T   : CARGOS_GERAIS_1T);

  // =========================================================================
  // FASE 'encerrando':
  //   1. subFase 'barra' — anima a barra verde de 0→100 em ~1.8s
  //   2. subFase 'fim'   — barra some, FIM ocupa a tela, som toca
  //   3. Após 2.5s no FIM, avança para tela de resumo ('fim')
  // =========================================================================
  useEffect(() => {
    if (estado.fase !== 'encerrando') return;

    setSubFase('barra');
    setBarraProgresso(0);

    const duracao = 1800;
    const inicio = performance.now();

    const animar = (agora) => {
      const pct = Math.min(((agora - inicio) / duracao) * 100, 100);
      setBarraProgresso(pct);
      if (pct < 100) {
        barraRef.current = requestAnimationFrame(animar);
      } else {
        // Barra completa → mostra FIM e toca o som
        setSubFase('fim');
        const audio = new Audio(somUrna);
        audio.volume = 0.50;
        audio.play().catch(() => {});
        // Após 2.5s exibindo FIM, vai para tela de resumo
        setTimeout(() => {
          setEstado(prev => ({ ...prev, fase: 'fim' }));
        }, 2500);
      }
    };

    barraRef.current = requestAnimationFrame(animar);

    return () => {
      if (barraRef.current) cancelAnimationFrame(barraRef.current);
    };
  }, [estado.fase]);

  // =========================================================================
  // LÓGICA DOS BOTÕES
  // =========================================================================
  const pressionar = useCallback((tecla) => {
    setEstado(prev => {
      if (prev.fase === 'fim' || prev.fase === 'encerrando') return prev;

      // Tela de início — dígito inicia a votação; BRANCO só se não houver dígitos
      if (prev.fase === 'inicio') {
        if (/^\d$/.test(tecla)) return { ...prev, fase: 'votando', digitos: [tecla] };
        if (tecla === 'BRANCO')  return { ...prev, fase: 'confirmar', branco: true };
        return prev;
      }

      const c = CARGOS[prev.cargoIdx];

      // CORRIGE
      if (tecla === 'CORRIGE') {
        if (prev.fase === 'confirmar' && prev.branco) {
          return { ...prev, fase: 'votando', branco: false, digitos: [] };
        }
        return { ...prev, fase: 'votando', digitos: [], branco: false };
      }

      // BRANCO — só permitido se nenhum dígito foi digitado ainda
      if (tecla === 'BRANCO') {
        if (prev.fase !== 'votando') return prev;
        if (prev.digitos.length > 0) return prev; // já digitou número → ignorar
        return { ...prev, fase: 'confirmar', branco: true, digitos: [] };
      }

      // CONFIRMA
      if (tecla === 'CONFIRMA') {
        if (prev.fase !== 'confirmar') return prev;
        let voto;
        if (prev.branco) {
          voto = 'BRANCO';
        } else {
          const candidatos = getCandidatos(c.id, turno, tipoEleicao);
          const numero = prev.digitos.join('');
          const candidatoValido = !!candidatos[numero];
          // Bloqueia senador duplicado: se senador_2 votou no mesmo número que senador_1
          const senadorDuplicado =
            c.id === 'senador_2' &&
            prev.votos['senador_1'] === numero &&
            prev.votos['senador_1'] !== 'NULO' &&
            prev.votos['senador_1'] !== 'BRANCO';
          voto = (candidatoValido && !senadorDuplicado) ? numero : 'NULO';
        }
        const novosVotos = { ...prev.votos, [c.id]: voto };
        const proximo = prev.cargoIdx + 1;
        if (proximo >= CARGOS.length) {
          return { ...INICIAL, fase: 'encerrando', votos: novosVotos, cargoIdx: prev.cargoIdx };
        }
        return { ...INICIAL, fase: 'votando', cargoIdx: proximo, votos: novosVotos, digitos: [] };
      }

      // DÍGITO
      if (/^\d$/.test(tecla) && prev.fase === 'votando') {
        const novos = [...prev.digitos, tecla];
        if (novos.length === c.digitos) return { ...prev, digitos: novos, fase: 'confirmar' };
        return { ...prev, digitos: novos };
      }

      return prev;
    });
  }, [CARGOS, turno, tipoEleicao]);
  useEffect(() => {
    const fn = (e) => {
      if (e.key >= '0' && e.key <= '9') pressionar(e.key);
      else if (e.key === 'Enter')     pressionar('CONFIRMA');
      else if (e.key === 'Backspace') pressionar('CORRIGE');
      else if (e.key === 'b' || e.key === 'B') pressionar('BRANCO');
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [pressionar]);

  // =========================================================================
  // RENDER DO CONTEÚDO DO DISPLAY
  // =========================================================================
  const renderConteudoDisplay = () => {
    const c = CARGOS[estado.cargoIdx];

    // Tela inicial
    if (estado.fase === 'inicio') {
      return (
        <div className="display-conteudo">
          <div className="display-texto-central">
            INÍCIO DA VOTAÇÃO
            <br />
            IDENTIFIQUE O ELEITOR
          </div>
        </div>
      );
    }

    // Tela de encerramento
    if (estado.fase === 'encerrando') {
      if (subFase === 'barra') {
        return (
          <div className="display-conteudo display-encerrando">
            <div className="display-barra-container">
              <div
                className="display-barra-progresso"
                style={{ width: `${barraProgresso}%` }}
              />
            </div>
            <div className="display-processando">GRAVANDO</div>
          </div>
        );
      }
      // subFase === 'fim'
      return (
        <div className="display-conteudo display-encerrando">
          <div className="display-fim-texto">FIM</div>
          <div className="urna-votou-badge">VOTOU</div>
        </div>
      );
    }

    if (estado.fase === 'fim') return null;

    // Voto em branco aguardando confirmação
    if (estado.fase === 'confirmar' && estado.branco) {
      return (
        <div className="display-conteudo" style={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}>
          <div className="display-cargo">{c.nome}</div>
          <div className="display-texto-central" style={{ fontSize: '22px', marginBottom: '16px' }}>
            VOTO EM BRANCO
          </div>
          <div className="display-instrucao">
            Aperte a tecla:<br />
            <b>CONFIRMA</b> para confirmar seu voto em branco<br />
            <b>CORRIGE</b> para recomeçar
          </div>
        </div>
      );
    }

    // Número completo aguardando confirmação
    if (estado.fase === 'confirmar') {
      const candidatosConf = getCandidatos(c.id, turno, tipoEleicao);
      const numero = estado.digitos.join('');
      const candidatoConf = candidatosConf[numero] || null;
      const senadorDuplicado =
        c.id === 'senador_2' &&
        estado.votos['senador_1'] === numero &&
        estado.votos['senador_1'] !== 'NULO' &&
        estado.votos['senador_1'] !== 'BRANCO';
      const seraVotoNulo = !candidatoConf || senadorDuplicado;

      return (
        <div className="display-conteudo" style={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}>
          <div className="display-cargo">{c.nome}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#555' }}>Número:</span>
            <span className="display-numero-confirmacao" style={{ fontSize: '32px', letterSpacing: '6px', margin: 0 }}>
              {numero}
            </span>
          </div>
          {seraVotoNulo ? (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#111', letterSpacing: '0.1em' }}>VOTO NULO</div>
              <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>
                {senadorDuplicado
                  ? 'Candidato já escolhido no 1º voto para senador'
                  : 'Número não corresponde a nenhum candidato'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              {candidatoConf.foto && (
                <img
                  src={candidatoConf.foto}
                  alt={candidatoConf.nome}
                  className="display-foto-candidato"
                />
              )}
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>{candidatoConf.nome}</div>
                <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{candidatoConf.partido}</div>
              </div>
            </div>
          )}
          <div className="display-instrucao">
            Aperte a tecla:<br />
            <b>CONFIRMA</b> para confirmar seu voto<br />
            <b>CORRIGE</b> para recomeçar
          </div>
        </div>
      );
    }

    // Digitando
    const candidatos = getCandidatos(c.id, turno, tipoEleicao);
    const numeroDigitado = estado.digitos.join('');
    const candidatoAtual = candidatos[numeroDigitado] || null;

    return (
      <div className="display-conteudo" style={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}>
        <div className="display-cargo">{c.nome}</div>
        <div style={{ fontSize: '12px', color: '#333', marginBottom: '10px' }}>
          Digite o número do candidato a {c.nome.charAt(0) + c.nome.slice(1).toLowerCase()}
        </div>
        <div className="display-digitos-row">
          {Array.from({ length: c.digitos }).map((_, i) => {
            const val = estado.digitos[i];
            const isCursor = i === estado.digitos.length;
            return (
              <div key={i} className={`display-digito${isCursor ? ' cursor-ativo' : ''}`}>
                {val !== undefined ? val : ''}
              </div>
            );
          })}
        </div>
        {estado.digitos.length > 0 && (
          <div style={{ marginTop: '10px', minHeight: '36px' }}>
            {candidatoAtual ? (
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>
                  {candidatoAtual.nome}
                </div>
                <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                  {candidatoAtual.partido}
                </div>
              </div>
            ) : (
              estado.digitos.length < c.digitos
                ? <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>Digitando...</div>
                : null
            )}
          </div>
        )}
      </div>
    );
  };

  // =========================================================================
  // TELA DE SELEÇÃO DE TURNO
  // =========================================================================
  // PASSO 1 — ESCOLHA DO TIPO DE ELEIÇÃO
  // =========================================================================
  if (tipoEleicao === null) {
    return (
      <div className="urna-page">
        <div className="urna-voltar-row">
          <button className="icon-button" onClick={onVoltar}>
            <ArrowLeftIcon /><span>Sair</span>
          </button>
        </div>
        <div className="urna-selecao-card">
          <img src={brasaoImg} alt="Brasão" className="urna-selecao-brasao" />
          <h2 className="urna-selecao-titulo">Simulador de Urna Eletrônica</h2>
          <p className="urna-selecao-subtitulo">Selecione o tipo de eleição que deseja simular</p>
          <div className="urna-selecao-opcoes">
            <button className="urna-opcao-card urna-opcao-gerais" onClick={() => setTipoEleicao('gerais')}>
              <div className="urna-opcao-icone">
                <EleicaoGeraisIcon size={52} color="#1e3a8a" />
              </div>
              <div className="urna-opcao-nome">Eleições Gerais</div>
              <div className="urna-opcao-desc">Dep. Federal · Dep. Estadual<br />Senador · Governador · Presidente</div>
            </button>
            <button className="urna-opcao-card urna-opcao-municipal" onClick={() => setTipoEleicao('municipal')}>
              <div className="urna-opcao-icone">
                <EleicaoMunicipalIcon size={52} color="#4c1d95" />
              </div>
              <div className="urna-opcao-nome">Eleições Municipais</div>
              <div className="urna-opcao-desc">Vereador · Prefeito</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // PASSO 2 — ESCOLHA DO TURNO
  // =========================================================================
  if (turno === null) {
    const config = tipoEleicao === 'municipal'
      ? {
          label1: 'Vereador · Prefeito',
          label2: 'Prefeito',
        }
      : {
          label1: 'Dep. Federal · Dep. Estadual · Senador (×2) · Governador · Presidente',
          label2: 'Governador · Presidente',
        };

    return (
      <div className="urna-page">
        <div className="urna-voltar-row">
          <button className="icon-button" onClick={() => setTipoEleicao(null)}>
            <ArrowLeftIcon /><span>Voltar</span>
          </button>
        </div>
        <div className="urna-selecao-card">
          <img src={brasaoImg} alt="Brasão" className="urna-selecao-brasao" />
          <h2 className="urna-selecao-titulo">
            {tipoEleicao === 'municipal' ? 'Eleições Municipais' : 'Eleições Gerais'}
          </h2>
          <p className="urna-selecao-subtitulo">Selecione o turno que deseja simular</p>
          <div className="urna-turno-opcoes">
            <button
              className="urna-turno-card urna-turno-primeiro"
              onClick={() => { setTurno(1); setEstado(INICIAL); }}
            >
              <div className="urna-turno-topo">
                <div className="urna-turno-numero">1º</div>
                <div className="urna-turno-label">Turno</div>
              </div>
              <div className="urna-turno-rodape">
                <div className="urna-turno-cargos">{config.label1}</div>
              </div>
            </button>
            <button
              className="urna-turno-card urna-turno-segundo"
              onClick={() => { setTurno(2); setEstado(INICIAL); }}
            >
              <div className="urna-turno-topo">
                <div className="urna-turno-numero">2º</div>
                <div className="urna-turno-label">Turno</div>
              </div>
              <div className="urna-turno-rodape">
                <div className="urna-turno-cargos">{config.label2}</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TELA FINAL (resumo dos votos)
  // =========================================================================
  if (estado.fase === 'fim') {
  const totalCargos = CARGOS.length;
  const especiais = CARGOS.filter(c => {
    const v = estado.votos[c.id];
    return v === 'BRANCO' || v === 'NULO';
  }).length;
  const validos = totalCargos - especiais;

  return (
    <div className="urna-page urna-fim-page">
      <div className="urna-voltar-row">
        <button className="icon-button" onClick={onVoltar}>
          <ArrowLeftIcon /><span>Sair</span>
        </button>
      </div>

      <div className="urna-fim-card">
        {/* Cabeçalho */}
        <div className="urna-fim-hero">
          <div className="urna-fim-check-ring">
            <CheckIcon style={{ width: 38, height: 38, color: '#fff', strokeWidth: 3 }} />
          </div>
          <h2 className="urna-fim-titulo">Votação Encerrada</h2>

          <div className="urna-fim-stats">
            <div className="urna-fim-stat">
              <span className="urna-fim-stat-num">{totalCargos}</span>
              <span className="urna-fim-stat-label">Cargos</span>
            </div>
            <div className="urna-fim-stat urna-fim-stat-ok">
              <span className="urna-fim-stat-num">{validos}</span>
              <span className="urna-fim-stat-label">Válidos</span>
            </div>
            <div className="urna-fim-stat urna-fim-stat-warn">
              <span className="urna-fim-stat-num">{especiais}</span>
              <span className="urna-fim-stat-label">Branco / Nulo</span>
            </div>
          </div>
        </div>

        {/* Lista de votos */}
        <div className="urna-fim-lista">
          {CARGOS.map((c, idx) => {
            const voto = estado.votos[c.id] || '—';
            const candidatos = getCandidatos(c.id, turno, tipoEleicao);
            const candidato = candidatos[voto];
            const isBranco = voto === 'BRANCO';
            const isNulo = voto === 'NULO';
            const isEspecial = isBranco || isNulo || voto === '—';

            const modifier = isBranco ? 'branco' : isNulo ? 'nulo' : 'valido';

            return (
              <article
                key={`${c.id}-${idx}`}
                className={`urna-fim-item urna-fim-item-${modifier}`}
              >
                <header className="urna-fim-item-head">
                  <span className="urna-fim-item-index">{String(idx + 1).padStart(2, '0')}</span>
                  <span className="urna-fim-cargo">{c.nome}</span>
                </header>

                {isEspecial ? (
                  <div className="urna-fim-especial">
                    <span className={`urna-fim-tag urna-fim-tag-${voto.toLowerCase()}`}>
                      {voto === '—' ? 'SEM VOTO' : `VOTO ${voto}`}
                    </span>
                  </div>
                ) : (
                  <div className="urna-fim-corpo">
                    <div className="urna-fim-numero-bloco">
                      <span className="urna-fim-numero-badge">{voto}</span>
                    </div>
                    <div className="urna-fim-info">
                      <span className="urna-fim-candidato-nome">
                        {candidato?.nome || 'Candidato'}
                      </span>
                      <span className="urna-fim-candidato-partido">
                        {candidato?.partido || '—'}
                      </span>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <button
          className="urna-btn-reiniciar"
          onClick={() => {
            setBarraProgresso(0);
            setEstado(INICIAL);
            setTurno(null);
            setTipoEleicao(null);
          }}
        >
          Votar Novamente
        </button>
      </div>
    </div>
  );
}

  // =========================================================================
  // RENDER PRINCIPAL DA URNA
  // =========================================================================
  const bloqueado = estado.fase === 'encerrando';

  const cargoAtualFolheto = CARGOS[estado.cargoIdx] || CARGOS[0];
  const candidatosFolheto = getCandidatos(cargoAtualFolheto.id, turno, tipoEleicao);

  const handleDragStart = (e) => {
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    setDragStartY(y);
    setDragging(true);
  };

  const handleDragMove = (e) => {
    if (!dragging || dragStartY === null) return;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    const delta = dragStartY - y; // positivo = arrastou para cima
    if (delta > 30) { setFolhetoAberto(true); setDragging(false); setDragStartY(null); }
    if (delta < -30) { setFolhetoAberto(false); setDragging(false); setDragStartY(null); }
  };

  const handleDragEnd = () => {
    setDragging(false);
    setDragStartY(null);
  };

  return (
    <div className="urna-page">
      <div className="urna-voltar-row">
        <button className="icon-button" onClick={onVoltar}>
          <ArrowLeftIcon /><span>Sair</span>
        </button>
      </div>

      <div className="urna-externa">

        {/* Tampa trapezoidal superior */}
        <div className="urna-tampa" />

        {/* Corpo principal */}
        <div className="urna-corpo-principal">
          <div className="urna-meio">

            {/* ---- DISPLAY ---- */}
            <div className="urna-display-wrapper">
              <div className="urna-display">
                <div className="display-topo">
                  <span className="display-topo-data">{hora}</span>
                  <span className="display-topo-treinamento">TREINAMENTO</span>
                </div>
                {renderConteudoDisplay()}
                <div className="display-rodape">
                  Município: 13897 - FORTALEZA    Zona: 0080    Seção: 0329
                </div>
              </div>
            </div>

            {/* ---- PAINEL DIREITO ---- */}
            <div className="urna-painel-direito">

              {/* Logo Justiça Eleitoral — brasão real */}
              <div className="urna-logo-je">
                <img src={brasaoImg} alt="Brasão da República" className="urna-brasao-img" />
                <div className="urna-je-texto">
                  <span>JUSTIÇA</span>
                  <span>ELEITORAL</span>
                </div>
              </div>

              {/* Painel preto do teclado */}
              <div className="urna-teclado-painel">
                <div className="urna-numpad-grid">
                  {[1,2,3,4,5,6,7,8,9].map(n => (
                    <button
                      key={n}
                      className="urna-tecla-num"
                      onClick={() => !bloqueado && pressionar(String(n))}
                      disabled={bloqueado}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="urna-numpad-zero">
                  <button
                    className="urna-tecla-num urna-tecla-zero-btn"
                    onClick={() => !bloqueado && pressionar('0')}
                    disabled={bloqueado}
                  >
                    0
                  </button>
                </div>
                <div className="urna-teclado-divisor" />
                <div className="urna-teclas-acao-row">
                  <button className="urna-tecla-acao urna-tecla-branco"   onClick={() => !bloqueado && pressionar('BRANCO')}   disabled={bloqueado}>BRANCO</button>
                  <button className="urna-tecla-acao urna-tecla-corrige"  onClick={() => !bloqueado && pressionar('CORRIGE')}  disabled={bloqueado}>CORRIGE</button>
                  <button className="urna-tecla-acao urna-tecla-confirma" onClick={() => !bloqueado && pressionar('CONFIRMA')} disabled={bloqueado}>CONFIRMA</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pés da urna */}
        <div className="urna-base">
          {[0,1,2,3,4,5].map(i => <div key={i} className="urna-pe" />)}
        </div>

      </div>

      {/* Indicador de progresso de cargos */}
      <div className="urna-progresso-cargos">
        {CARGOS.map((c, i) => (
          <div
            key={c.id}
            className={`urna-cargo-bolinha${i < estado.cargoIdx ? ' concluido' : ''}${i === estado.cargoIdx ? ' ativo' : ''}`}
            title={c.nome}
          />
        ))}
      </div>
      <div className="urna-cargo-nome-atual">
        {estado.fase === 'inicio'      && 'Pronto para votar'}
        {estado.fase === 'encerrando'  && 'Registrando voto...'}
        {(estado.fase === 'votando' || estado.fase === 'confirmar') && `Votando para: ${CARGOS[estado.cargoIdx].nome}`}
      </div>

      {/* ================================================================
          FOLHETO — cola de candidatos arrastável para cima
          ================================================================ */}
      {estado.fase !== 'encerrando' && (
        <div
          className={`folheto-drawer ${folhetoAberto ? 'folheto-aberto' : ''}`}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          {/* Alça de arrasto */}
          <div className="folheto-alca" onClick={() => setFolhetoAberto(v => !v)}>
            <div className="folheto-alca-barra" />
            <span className="folheto-alca-texto">
              {folhetoAberto ? 'Fechar cola ▼' : 'Ver candidatos ▲'}
            </span>
          </div>

          {/* Conteúdo da cola */}
          <div className="folheto-conteudo">
            <h3 className="folheto-titulo">
              Cola de Candidatos  {cargoAtualFolheto.nome}
            </h3>
            <div className="folheto-lista">
              {Object.entries(candidatosFolheto).map(([numero, c]) => (
                <div key={numero} className="folheto-item">
                  <span className="folheto-numero">{numero}</span>
                  <div className="folheto-info">
                    <span className="folheto-nome">{c.nome}</span>
                    <span className="folheto-partido">{c.partido}</span>
                  </div>
                </div>
              ))}
              {Object.keys(candidatosFolheto).length === 0 && (
                <p className="folheto-vazio">Nenhum candidato cadastrado para este cargo.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
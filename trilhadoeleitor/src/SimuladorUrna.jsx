import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeftIcon, CheckIcon, EleicaoGeraisIcon, EleicaoMunicipalIcon } from './Icons';
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
        audio.volume = 1.0;
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
        const voto = prev.branco ? 'BRANCO' : prev.digitos.join('');
        const novosVotos = { ...prev.votos, [c.id]: voto };
        const proximo = prev.cargoIdx + 1;

        // Último cargo (presidente) → vai para 'encerrando' em vez de 'fim' direto
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
  }, [CARGOS]);
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
            <div className="display-processando">PROCESSANDO...</div>
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
      return (
        <div className="display-conteudo" style={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}>
          <div className="display-cargo">{c.nome}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#333' }}>Número:</span>
            <span className="display-numero-confirmacao" style={{ fontSize: '36px', letterSpacing: '6px', margin: 0 }}>
              {estado.digitos.join('')}
            </span>
          </div>
          <div className="display-instrucao">
            Aperte a tecla:<br />
            <b>CONFIRMA</b> para confirmar seu voto<br />
            <b>CORRIGE</b> para recomeçar
          </div>
        </div>
      );
    }

    // Digitando
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
            <ArrowLeftIcon /><span>Voltar</span>
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
    return (
      <div className="urna-page">
        <div className="urna-voltar-row">
          <button className="icon-button" onClick={onVoltar}>
            <ArrowLeftIcon /><span>Voltar</span>
          </button>
        </div>
        <div className="urna-fim-card">
          <div className="urna-fim-icon">
            <CheckIcon style={{ width: 52, height: 52, color: '#16a34a', strokeWidth: 2 }} />
          </div>
          <h2>Votação Encerrada</h2>
          <p>Sua participação foi registrada com sucesso. Obrigado por votar!</p>
          <div className="urna-fim-resumo">
            {CARGOS.map((c) => (
              <div key={c.id} className="urna-fim-linha">
                <span className="urna-fim-cargo">{c.nome}</span>
                <span className="urna-fim-numero">{estado.votos[c.id] || '—'}</span>
              </div>
            ))}
          </div>
          <button className="urna-btn-reiniciar" onClick={() => { setBarraProgresso(0); setEstado(INICIAL); setTurno(null); setTipoEleicao(null); }}>
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

  return (
    <div className="urna-page">
      <div className="urna-voltar-row">
        <button className="icon-button" onClick={onVoltar}>
          <ArrowLeftIcon /><span>Voltar</span>
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
                  Município: 13218 - ARACATI &nbsp;&nbsp; Zona: 0008
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
    </div>
  );
}
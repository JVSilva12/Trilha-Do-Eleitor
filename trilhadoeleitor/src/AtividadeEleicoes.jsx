import { useEffect, useMemo, useState } from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import './AtividadeEleicoes.css';

const CARGOS = [
  {
    id: 'presidente',
    titulo: 'Presidente da Republica',
    reforco: 'Perfeito! Esse cargo atua no ambito federal e lidera o Executivo.'
  },
  {
    id: 'governador',
    titulo: 'Governador do Estado',
    reforco: 'Boa! O governador administra o estado e suas politicas publicas.'
  },
  {
    id: 'prefeito',
    titulo: 'Prefeito',
    reforco: 'Correto! O prefeito cuida do municipio e dos servicos locais.'
  },
  {
    id: 'senador',
    titulo: 'Senador',
    reforco: 'Mandou bem! O senador representa o estado no Senado Federal.'
  },
  {
    id: 'deputado',
    titulo: 'Deputado Federal',
    reforco: 'Excelente! Esse cargo cria leis federais e fiscaliza o Executivo.'
  },
  {
    id: 'vereador',
    titulo: 'Vereador',
    reforco: 'Isso! O vereador cria leis municipais e fiscaliza o prefeito.'
  }
];

const FUNCOES = [
  {
    id: 'f1',
    cargoId: 'senador',
    texto: 'Representa o estado no Senado',
    dica: 'Dica: este cargo fala pelo estado no Congresso.'
  },
  {
    id: 'f2',
    cargoId: 'prefeito',
    texto: 'Administra o municipio e servicos locais',
    dica: 'Dica: pense em escola, saude e ruas da cidade.'
  },
  {
    id: 'f3',
    cargoId: 'deputado',
    texto: 'Elabora leis federais e fiscaliza o Executivo',
    dica: 'Dica: este cargo atua na Camara dos Deputados.'
  },
  {
    id: 'f4',
    cargoId: 'governador',
    texto: 'Administra o estado',
    dica: 'Dica: este cargo atua entre a cidade e o pais.'
  },
  {
    id: 'f5',
    cargoId: 'presidente',
    texto: 'Sanciona ou veta leis federais',
    dica: 'Dica: este cargo lidera o Executivo federal.'
  },
  {
    id: 'f6',
    cargoId: 'vereador',
    texto: 'Elabora leis municipais e fiscaliza o prefeito',
    dica: 'Dica: este cargo atua na Camara Municipal.'
  }
];

const embaralhar = (lista) => {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

function FuncaoItem({ item, disabled }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'grab'
  };

  return (
    <button
      ref={setNodeRef}
      className={`funcao-chip${disabled ? ' disabled' : ''}`}
      style={style}
      type="button"
      {...listeners}
      {...attributes}
    >
      {item.texto}
    </button>
  );
}

function CargoDrop({ cargo, item, isResolvido }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `cargo-${cargo.id}`,
    disabled: isResolvido
  });

  return (
    <div
      ref={setNodeRef}
      className={`cargo-card${isResolvido ? ' resolvido' : ''}${isOver ? ' hover' : ''}`}
    >
      <div className="cargo-title">{cargo.titulo}</div>
      <div className="cargo-slot">
        {item ? item.texto : 'Arraste a funcao correta aqui'}
      </div>
      {isResolvido && <div className="cargo-reward">{cargo.reforco}</div>}
    </div>
  );
}

export default function AtividadeEleicoes({ onVoltar }) {
  const [disponiveis, setDisponiveis] = useState(() => embaralhar(FUNCOES.map((f) => f.id)));
  const [atribuidas, setAtribuidas] = useState({});
  const [dica, setDica] = useState('');
  const [pulse, setPulse] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const funcoesPorId = useMemo(() => Object.fromEntries(FUNCOES.map((f) => [f.id, f])), []);

  const totalResolvidas = Object.keys(atribuidas).length;
  const completou = totalResolvidas === CARGOS.length;

  const handleDragEnd = (evento) => {
    const { active, over } = evento;
    if (!over) return;

    const funcao = funcoesPorId[active.id];
    if (!funcao) return;

    const cargoId = over.id.replace('cargo-', '');
    const cargo = CARGOS.find((c) => c.id === cargoId);

    if (!cargo) return;
    if (atribuidas[cargoId]) return;

    if (funcao.cargoId === cargoId) {
      setAtribuidas((prev) => ({ ...prev, [cargoId]: funcao.id }));
      setDisponiveis((prev) => prev.filter((id) => id !== funcao.id));
      setDica('');
    } else {
      setDica(funcao.dica);
      setPulse((p) => p + 1);
    }
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 600px)');
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  const handleSelectChange = (cargoId, funcaoId) => {
    if (!funcaoId) return;
    const funcao = funcoesPorId[funcaoId];

    if (funcao.cargoId === cargoId) {
      setAtribuidas((prev) => ({ ...prev, [cargoId]: funcao.id }));
      setDisponiveis((prev) => prev.filter((id) => id !== funcao.id));
      setDica('');
    } else {
      setDica(funcao.dica);
      setPulse((p) => p + 1);
    }
  };

  const reiniciar = () => {
    setDisponiveis(embaralhar(FUNCOES.map((f) => f.id)));
    setAtribuidas({});
    setDica('');
    setPulse((p) => p + 1);
  };

  return (
    <div className="atividade-eleicoes">
      <header className="atividade-header">
        <div>
          <h1>Atividade Interativa</h1>
          <p>Trilha 2 • Como funcionam as eleicoes</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-outline" onClick={onVoltar}>Voltar</button>
          <button type="button" className="btn-primary" onClick={reiniciar}>Reembaralhar</button>
        </div>
      </header>

      <section className="atividade-intro">
        <p>
          Arraste cada funcao para o cargo correspondente. Quando acertar, o cargo se ilumina
          com uma confirmacao visual e uma frase de reforco. Se errar, a funcao volta para a lista
          com uma dica sutil.
        </p>
        <div className="progresso">
          <span>Conexoes corretas</span>
          <strong>{totalResolvidas}/{CARGOS.length}</strong>
        </div>
      </section>

      {isMobile ? (
        <section className="atividade-grid">
          <div className="funcoes-col">
            <h2>Funcoes disponiveis</h2>
            <div className={`funcoes-lista${pulse ? ' pulse' : ''}`} key={pulse}>
              {disponiveis.map((id) => (
                <FuncaoItem key={id} item={funcoesPorId[id]} disabled />
              ))}
              {disponiveis.length === 0 && (
                <div className="lista-vazia">Todas as funcoes foram conectadas.</div>
              )}
            </div>
            {dica && <div className="dica-spacer" aria-hidden="true" />}
          </div>

          <div className="cargos-col">
            <h2>Cargos publicos</h2>
            <div className="cargos-lista">
              {CARGOS.map((cargo) => {
                const funcaoId = atribuidas[cargo.id];
                const funcao = funcaoId ? funcoesPorId[funcaoId] : null;
                const isResolvido = Boolean(funcao);

                return (
                  <div
                    key={cargo.id}
                    className={`cargo-card${isResolvido ? ' resolvido' : ''}`}
                  >
                    <div className="cargo-title">{cargo.titulo}</div>
                    {isResolvido ? (
                      <div className="cargo-slot">{funcao.texto}</div>
                    ) : (
                      <select
                        className="cargo-select"
                        value=""
                        onChange={(event) => handleSelectChange(cargo.id, event.target.value)}
                      >
                        <option value="" disabled>Escolha a funcao correta</option>
                        {disponiveis.map((id) => (
                          <option key={id} value={id}>
                            {funcoesPorId[id].texto}
                          </option>
                        ))}
                      </select>
                    )}
                    {isResolvido && <div className="cargo-reward">{cargo.reforco}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        <DndContext onDragEnd={handleDragEnd}>
          <section className="atividade-grid">
            <div className="funcoes-col">
              <h2>Funcoes embaralhadas</h2>
              <div className={`funcoes-lista${pulse ? ' pulse' : ''}`} key={pulse}>
                {disponiveis.map((id) => (
                  <FuncaoItem key={id} item={funcoesPorId[id]} disabled={false} />
                ))}
                {disponiveis.length === 0 && (
                  <div className="lista-vazia">Todas as funcoes foram conectadas.</div>
                )}
              </div>
              {dica && <div className="dica-spacer" aria-hidden="true" />}
            </div>

            <div className="cargos-col">
              <h2>Cargos publicos</h2>
              <div className="cargos-lista">
                {CARGOS.map((cargo) => {
                  const funcaoId = atribuidas[cargo.id];
                  const funcao = funcaoId ? funcoesPorId[funcaoId] : null;
                  return (
                    <CargoDrop
                      key={cargo.id}
                      cargo={cargo}
                      item={funcao}
                      isResolvido={Boolean(funcao)}
                    />
                  );
                })}
              </div>
            </div>
          </section>
        </DndContext>
      )}

      {completou && (
        <section className="finalizacao">
          <h3>Parabens! Voce concluiu a atividade.</h3>
          <p>Agora voce domina as responsabilidades basicas de cada cargo.</p>
        </section>
      )}

      {dica && (
        <div className="dica-flutuante" role="status" aria-live="polite">
          {dica}
        </div>
      )}
    </div>
  );
}

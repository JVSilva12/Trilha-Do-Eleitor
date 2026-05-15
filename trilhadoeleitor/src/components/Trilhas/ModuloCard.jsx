import StatusBadge from './StatusBadge';
import { CircleQuestionIcon, ClockIcon, DotsIcon, FileIcon, GripVerticalIcon, PlayIcon } from './TrilhaIcons';

export default function ModuloCard({ modulo, onEditar }) {
  return (
    <article className="modulo-card">
      <button type="button" className="modulo-handle" aria-label="Reordenar módulo">
        <GripVerticalIcon className="mini-icon" />
      </button>

      <div className="modulo-indice">{modulo.ordem}</div>

      <div className="modulo-conteudo">
        <div className="modulo-topo">
          <h3>{modulo.titulo}</h3>
          <StatusBadge status={modulo.status} textoPublicado="Publicado" />
        </div>

        <div className="modulo-metricas texto-secundario">
          <span>
            <PlayIcon className="mini-icon" />
            {modulo.videos} vídeo
          </span>
          <span>
            <FileIcon className="mini-icon" />
            {modulo.textos} texto
          </span>
          <span>
            <CircleQuestionIcon className="mini-icon" />
            {modulo.quizzes} quiz
          </span>
        </div>

        <p className="texto-secundario modulo-duracao">
          <ClockIcon className="mini-icon" />
          Duração: {modulo.duracao}
        </p>

        <div className="modulo-indicadores">
          <span className="indicador ok">Vídeo adicionado</span>
          <span className="indicador ok">Texto adicionado</span>
          <span className={`indicador ${modulo.quizAdicionado ? 'ok' : 'pendente'}`}>
            {modulo.quizAdicionado ? 'Quiz adicionado' : 'Adicionar quiz'}
          </span>
        </div>
      </div>

      <div className="modulo-acoes">
        <button type="button" className="btn-secundario btn-editar" onClick={() => onEditar?.(modulo)}>Editar</button>
        <button type="button" className="btn-opcoes" aria-label="Mais opções">
          <DotsIcon className="mini-icon" />
        </button>
      </div>
    </article>
  );
}

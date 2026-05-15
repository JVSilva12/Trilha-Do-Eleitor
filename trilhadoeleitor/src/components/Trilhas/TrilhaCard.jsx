import { Link } from 'react-router-dom';
import { useState } from 'react';
import StatusBadge from './StatusBadge';
import { BookIcon, CircleQuestionIcon, DotsIcon } from './TrilhaIcons';

export default function TrilhaCard({ trilha, onExcluir }) {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <article className="trilha-card-horizontal">
      <img src={trilha.imagem} alt={trilha.nome} className="trilha-capa" />

      <div className="trilha-conteudo">
        <h3>{trilha.nome}</h3>
        <p className="texto-secundario trilha-categoria">{trilha.categoria}</p>

        <div className="trilha-metricas texto-secundario">
          <span>
            <BookIcon className="mini-icon" />
            {trilha.modulos} módulos
          </span>
          <span>
            <CircleQuestionIcon className="mini-icon" />
            {trilha.quizzes} quizzes
          </span>
        </div>

        <p className="texto-secundario trilha-atualizacao">Atualizada em {trilha.atualizadaEm}</p>
      </div>

      <div className="trilha-acoes">
        <StatusBadge status={trilha.status} />

        <div className="trilha-botoes">
          <Link className="btn-secundario btn-editar" to={`/conteudista/trilhas/${trilha.id}/editar`}>
            Editar
          </Link>

          <div className="menu-opcoes-wrapper">
            <button className="btn-opcoes" onClick={() => setMenuAberto((valor) => !valor)} type="button" aria-label="Mais opções">
              <DotsIcon className="mini-icon" />
            </button>
            {menuAberto && (
              <div className="menu-opcoes">
                <Link to={`/conteudista/trilhas/${trilha.id}/editar`} onClick={() => setMenuAberto(false)}>
                  Editar
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMenuAberto(false);
                    onExcluir(trilha.id);
                  }}
                >
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

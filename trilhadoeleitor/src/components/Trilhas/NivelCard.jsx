import { BookmarkIcon } from './TrilhaIcons';

const coresNivel = {
  'Básico': 'verde',
  Intermediário: 'laranja',
  'Avançado': 'vermelho'
};

export default function NivelCard({ titulo, descricao, ativo, onClick }) {
  const cor = coresNivel[titulo] || 'verde';

  return (
    <button type="button" className={`nivel-card ${ativo ? 'ativo' : ''}`} onClick={onClick}>
      <span className={`nivel-icone ${cor}`}>
        <BookmarkIcon className="mini-icon" />
      </span>
      <div>
        <strong>{titulo}</strong>
        <span>{descricao}</span>
      </div>
    </button>
  );
}

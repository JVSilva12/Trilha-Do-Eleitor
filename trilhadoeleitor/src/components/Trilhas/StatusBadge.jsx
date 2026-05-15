export default function StatusBadge({ status, textoPublicado = 'Publicada', textoRascunho = 'Rascunho' }) {
  const publicado = status === 'publicada' || status === 'publicado';

  return (
    <span className={`status-badge ${publicado ? 'publicada' : 'rascunho'}`}>
      <span className="status-dot" />
      {publicado ? textoPublicado : textoRascunho}
    </span>
  );
}

import React from 'react';
import { PencilIcon, TrashIcon } from '../../Icons'; 

export default function TrilhaCard({ trilha, onExcluir, onEditar }) {
  const renderBadgeStatus = (status) => {
    const estiloPublicado = { background: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce7' };
    const estiloRascunho = { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' };
    const ativo = status === 'publicada';

    return (
      <span className="user-badge" style={ativo ? estiloPublicado : estiloRascunho}>
        {ativo ? 'Publicada' : 'Rascunho'}
      </span>
    );
  };

  return (
    <div className="perfil-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{trilha.nome}</h4>
          {renderBadgeStatus(trilha.status)}
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', textAlign: 'left' }}>{trilha.descricao}</p>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', marginTop: '4px' }}>
          {trilha.categoria} • {trilha.nivel}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          className="edit-avatar-btn" 
          title="Editar Conteúdo"
          style={{ position: 'static', width: '32px', height: '32px' }}
          onClick={() => onEditar(trilha.id)} // DISPARA O FLUXO REAL DE EDIÇÃO
        >
          <PencilIcon />
        </button>
        <button 
          className="remove-avatar-btn" 
          title="Excluir Trilha"
          style={{ position: 'static', width: '32px', height: '32px' }}
          onClick={() => onExcluir(trilha.id)}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
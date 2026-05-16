import React from 'react';
import { PencilIcon, TrashIcon } from '../../Icons'; 

// Importação das fotos nativas do projeto para o casamento de assets
import fotoUrna from '../../assets/urna.png'; 
import fotoProcesso from '../../assets/processo.png'; 
import fotoFakeNews from '../../assets/fakenews.png'; 

export default function TrilhaCard({ trilha, onExcluir, onEditar }) {
  
  // Resolve dinamicamente se usa a foto local do projeto ou o link externo cadastrado
  const mapearImagemTrilha = (imagemInformada) => {
    if (imagemInformada === 'urna') return fotoUrna;
    if (imagemInformada === 'processo') return fotoProcesso;
    if (imagemInformada === 'fakenews') return fotoFakeNews;
    if (imagemInformada && (imagemInformada.startsWith('http') || imagemInformada.startsWith('data:'))) {
      return imagemInformada;
    }
    return null; // Fallback para gradiente se não houver imagem
  };

  const formatarData = (dataString) => {
    if (!dataString) return "--/--/----";
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return "--/--/----";
    }
  };

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

  const imagemResolvida = mapearImagemTrilha(trilha.imagem);

  return (
    <div className="perfil-card" style={{ display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: '16px' }}>
        
        {/* Bloco da Esquerda: Imagem + Textos Informativos */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flex: 1 }}>
          
          {/* NOVO ELEMENTO VISUAL: Miniatura da Trilha */}
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '8px', 
            overflow: 'hidden', 
            flexShrink: 0,
            border: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)'
          }}>
            {imagemResolvida ? (
              <img src={imagemResolvida} alt={trilha.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }} />
            )}
          </div>

          {/* Dados Textuais Alinhados */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b', textAlign: 'left' }}>{trilha.nome}</h4>
              {renderBadgeStatus(trilha.status)}
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', textAlign: 'left' }}>{trilha.descricao}</p>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', marginTop: '4px' }}>
              {trilha.categoria} • {trilha.nivel}
            </span>
          </div>
        </div>

        {/* Menu de Ações Lógicas (Lápis e Lixeira) */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button 
            className="edit-avatar-btn" 
            title="Editar Conteúdo"
            style={{ position: 'static', width: '32px', height: '32px' }}
            onClick={() => onEditar(trilha.id)}
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

      {/* Rodapé Cronológico Automatizado */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        fontSize: '11px', 
        color: '#94a3b8', 
        borderTop: '1px solid #f1f5f9', 
        paddingTop: '8px',
        marginTop: '4px'
      }}>
        <span>📅 Criada em: {formatarData(trilha.data_criacao)}</span>
        <span>🔄 Última atualização: {formatarData(trilha.data_atualizacao)}</span>
      </div>
    </div>
  );
}
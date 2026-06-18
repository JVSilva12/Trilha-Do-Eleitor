import { useState } from 'react';
import api, { API_URL } from '../../api';
import NivelCard from '../../components/Trilhas/NivelCard';
import { categoriasTrilha, niveisTrilha } from '../../data/trilhasMock';
import { criarTrilha } from '../../services/trilhasService';
import { BookmarkIcon, InfoIcon, SaveIcon, SettingsIcon, UploadCloudIcon } from '../../components/Trilhas/TrilhaIcons';
import '../../styles/trilhas.css';
import './NovaTrilha.css';

const resolveAssetUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  return `${API_URL}${path}`;
};

const niveisDescricao = {
  'Básico': 'Conteúdo introdutório',
  'Intermediário': 'Conteúdo aprofundado',
  'Avançado': 'Conteúdo especializado'
};

export default function NovaTrilha({ onVoltar }) {
  const [salvando, setSalvando] = useState(false);
  const [uploadandoCapa, setUploadandoCapa] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    nivel: '',
    imagem: '',
    status: 'rascunho'
  });

  const atualizarCampo = (campo, valor) => {
    setForm((anterior) => ({ ...anterior, [campo]: valor }));
  };

  const handleUploadCapaTrilha = async (evento) => {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;
    setUploadandoCapa(true);
    const dadosFormulario = new FormData();
    dadosFormulario.append('file', arquivo);
    try {
      const response = await api.post(`/trilhas/upload-imagem`, dadosFormulario, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      atualizarCampo('imagem', response.data.url_imagem);
    } catch (error) {
      alert("Erro ao enviar imagem de capa. Tente novamente.");
    } finally {
      setUploadandoCapa(false);
    }
  };

  const handleSubmit = async (evento) => {
    evento.preventDefault();
    setSalvando(true);
    try {
      const payload = {
        ...form,
        categoria: form.categoria || 'Educação eleitoral',
        nivel: form.nivel || 'Básico',
      };
      await criarTrilha(payload);
      alert("Trilha criada com sucesso!");
      onVoltar();
    } catch (error) {
      alert(error.response?.data?.detail || 'Não foi possível criar a trilha.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="home-page nt-page">
      <main className="nt-main">
        <div className="nt-header-row">
          <button onClick={onVoltar} className="nav-btn nt-back-btn">
            ← Voltar
          </button>
          <div>
            <h2 className="nt-title">Nova Trilha Educativa</h2>
            <p className="nt-subtitle">Preencha os dados abaixo para criar um novo fluxo de estudos.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="nt-form">

          {/* SEÇÃO 1 — Informações básicas */}
          <section className="nt-card">
            <h3 className="nt-section-title">
              <SaveIcon className="nt-icon" />
              1. Informações básicas
            </h3>

            <div className="nt-field">
              <label className="nt-label">
                Nome da trilha <span className="nt-required">*</span>
              </label>
              <div className="nt-input-wrap">
                <input
                  type="text"
                  maxLength={100}
                  value={form.nome}
                  onChange={(e) => atualizarCampo('nome', e.target.value)}
                  placeholder="Ex.: Como funcionam as eleições"
                  required
                />
              </div>
              <span className="nt-counter">{form.nome.length}/100</span>
            </div>

            <div className="nt-field">
              <label className="nt-label">
                Descrição curta <span className="nt-required">*</span>
              </label>
              <div className="nt-input-wrap nt-textarea-wrap">
                <textarea
                  maxLength={300}
                  value={form.descricao}
                  onChange={(e) => atualizarCampo('descricao', e.target.value)}
                  placeholder="Descreva brevemente o que os eleitores irão aprender..."
                  required
                  rows={3}
                />
              </div>
              <span className="nt-counter">{form.descricao.length}/300</span>
            </div>
          </section>

          {/* SEÇÃO 2 — Categoria e nível */}
          <section className="nt-card">
            <h3 className="nt-section-title">
              <BookmarkIcon className="nt-icon" />
              2. Categoria e nível
            </h3>

            <div className="nt-row">
              <div className="nt-field nt-flex1">
                <label className="nt-label">Categoria <span className="nt-required">*</span></label>
                <div className="nt-input-wrap">
                  <select
                    value={form.categoria}
                    onChange={(e) => atualizarCampo('categoria', e.target.value)}
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categoriasTrilha.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="nt-field nt-flex1">
                <label className="nt-label">Nível de dificuldade <span className="nt-required">*</span></label>
                <div className="nt-input-wrap">
                  <select
                    value={form.nivel}
                    onChange={(e) => atualizarCampo('nivel', e.target.value)}
                    required
                  >
                    <option value="">Selecione o nível</option>
                    {niveisTrilha.map((niv) => (
                      <option key={niv} value={niv}>{niv}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Cards de nível compactos */}
            <div className="nt-niveis-grid">
              {niveisTrilha.map((nivel) => (
                <button
                  key={nivel}
                  type="button"
                  className={`nt-nivel-btn${form.nivel === nivel ? ' nt-nivel-ativo' : ''}`}
                  onClick={() => atualizarCampo('nivel', nivel)}
                >
                  <BookmarkIcon className="nt-nivel-icon" />
                  <span className="nt-nivel-nome">{nivel}</span>
                  <span className="nt-nivel-desc">{niveisDescricao[nivel]}</span>
                </button>
              ))}
            </div>
          </section>

          {/* SEÇÃO 3 — Imagem de capa */}
          <section className="nt-card">
            <h3 className="nt-section-title">
              <UploadCloudIcon className="nt-icon" />
              3. Imagem de capa
            </h3>

            <div className="nt-capa-row">
              {/* Pré-visualização */}
              <div className="nt-capa-preview">
                {form.imagem
                  ? <img src={resolveAssetUrl(form.imagem)} alt="Pré-visualização" />
                  : <span className="nt-capa-placeholder">Sem imagem</span>
                }
              </div>

              {/* Controles */}
              <div className="nt-capa-controls">
                <label className={`nt-upload-btn${uploadandoCapa ? ' nt-upload-loading' : ''}`}>
                  <UploadCloudIcon className="nt-upload-icon" />
                  {uploadandoCapa ? 'Enviando...' : 'Escolher arquivo'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={uploadandoCapa}
                    onChange={handleUploadCapaTrilha}
                  />
                </label>
                <span className="nt-upload-hint">PNG, JPG ou WEBP</span>

                <div className="nt-field" style={{ marginTop: '10px', marginBottom: 0 }}>
                  <label className="nt-label" style={{ fontSize: '11px' }}>Ou cole uma URL:</label>
                  <div className="nt-input-wrap">
                    <input
                      type="text"
                      value={form.imagem}
                      onChange={(e) => atualizarCampo('imagem', e.target.value)}
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SEÇÃO 4 — Configurações */}
          <section className="nt-card">
            <h3 className="nt-section-title">
              <SettingsIcon className="nt-icon" />
              4. Configurações
            </h3>

            <div className="nt-config-grid">
              <fieldset className="nt-fieldset">
                <legend className="nt-legend">Status <span className="nt-required">*</span></legend>
                <label className="nt-radio-label">
                  <input type="radio" name="status" checked={form.status === 'rascunho'} onChange={() => atualizarCampo('status', 'rascunho')} />
                  <span>
                    <strong>Rascunho</strong>
                    <small>Apenas você poderá ver e editar.</small>
                  </span>
                </label>
                <label className="nt-radio-label">
                  <input type="radio" name="status" checked={form.status === 'publicada'} onChange={() => atualizarCampo('status', 'publicada')} />
                  <span>
                    <strong>Publicada</strong>
                    <small>Disponível imediatamente aos eleitores.</small>
                  </span>
                </label>
              </fieldset>
            </div>

            {/* Aviso informativo — compacto */}
            <div className="nt-info-box">
              <InfoIcon className="nt-info-icon" />
              <p>
                Módulos, aulas, vídeos e quizzes podem ser adicionados após o salvamento inicial da trilha.
              </p>
            </div>
          </section>

          {/* AÇÕES */}
          <div className="nt-actions">
            <button type="button" className="nt-btn-cancelar" onClick={onVoltar}>
              Cancelar
            </button>
            <button type="submit" className="nt-btn-salvar" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar Trilha'}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
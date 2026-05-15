import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NivelCard from '../../components/Trilhas/NivelCard';
import { categoriasTrilha, niveisTrilha } from '../../data/trilhasMock';
import { criarTrilha } from '../../services/trilhasService';
import { BookmarkIcon, InfoIcon, SaveIcon, SettingsIcon, UploadCloudIcon } from '../../components/Trilhas/TrilhaIcons';

const niveisDescricao = {
  'Básico': 'Conteúdo introdutório',
  Intermediário: 'Conteúdo aprofundado',
  'Avançado': 'Conteúdo especializado'
};

export default function NovaTrilha() {
  const navigate = useNavigate();
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    nivel: '',
    imagem: '',
    status: 'rascunho',
    visibilidade: 'Pública'
  });

  const atualizarCampo = (campo, valor) => {
    setForm((anterior) => ({ ...anterior, [campo]: valor }));
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
      const nova = await criarTrilha(payload);
      navigate(`/conteudista/trilhas/${nova.id}/editar`);
    } catch (error) {
      alert(error.response?.data?.detail || 'Não foi possível criar a trilha.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <section className="page-card-frame">
      <Link to="/conteudista/trilhas" className="link-voltar">
        ← Voltar para trilhas
      </Link>

      <div className="secao-header coluna principal-header">
        <div>
          <h2>Nova trilha educativa</h2>
          <p>Preencha as informações para criar uma nova trilha.</p>
        </div>
      </div>

      <form className="form-trilha" onSubmit={handleSubmit}>
        <article className="bloco-form bloco-com-icone">
          <h3>
            <span className="header-icone"><SaveIcon className="mini-icon" /></span>
            1. Informações básicas
          </h3>

          <label>
            Nome da trilha <span className="obrigatorio">*</span>
            <input
              type="text"
              maxLength={100}
              value={form.nome}
              onChange={(evento) => atualizarCampo('nome', evento.target.value)}
              className="input-padrao"
              placeholder="Ex.: Como funcionam as eleições"
              required
            />
            <small className="contador-texto">{form.nome.length}/100</small>
          </label>

          <label>
            Descrição curta <span className="obrigatorio">*</span>
            <textarea
              maxLength={300}
              value={form.descricao}
              onChange={(evento) => atualizarCampo('descricao', evento.target.value)}
              className="input-padrao"
              placeholder="Descreva de forma breve o que os usuarios comuns irão aprender nesta trilha..."
              required
            />
            <small className="contador-texto">{form.descricao.length}/300</small>
          </label>
        </article>

        <article className="bloco-form bloco-com-icone">
          <h3>
            <span className="header-icone"><BookmarkIcon className="mini-icon" /></span>
            2. Categoria e nível
          </h3>

          <div className="duas-colunas">
            <label>
              Categoria <span className="obrigatorio">*</span>
              <select
                value={form.categoria}
                onChange={(evento) => atualizarCampo('categoria', evento.target.value)}
                className="input-padrao"
                required
              >
                <option value="">Selecione uma categoria</option>
                {categoriasTrilha.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Nível de dificuldade <span className="obrigatorio">*</span>
              <select value={form.nivel} onChange={(evento) => atualizarCampo('nivel', evento.target.value)} className="input-padrao" required>
                <option value="">Selecione o nível</option>
                {niveisTrilha.map((nivel) => (
                  <option key={nivel} value={nivel}>
                    {nivel}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="niveis-grid">
            {niveisTrilha.map((nivel) => (
              <NivelCard
                key={nivel}
                titulo={nivel}
                descricao={niveisDescricao[nivel]}
                ativo={form.nivel === nivel}
                onClick={() => atualizarCampo('nivel', nivel)}
              />
            ))}
          </div>
        </article>

        <article className="bloco-form bloco-com-icone">
          <h3>
            <span className="header-icone"><UploadCloudIcon className="mini-icon" /></span>
            3. Imagem de capa
          </h3>
          <p className="texto-secundario">A imagem será exibida na lista de trilhas e detalhes da trilha.</p>

          <label className="upload-fake">
            <UploadCloudIcon className="upload-icon" />
            <strong>Arraste uma imagem ou <span>clique para selecionar</span></strong>
            <small>Recomendado: 1280x720px (máx. 5MB)</small>
            <input
              type="text"
              value={form.imagem}
              onChange={(evento) => atualizarCampo('imagem', evento.target.value)}
              className="input-padrao"
              placeholder="Cole uma URL de imagem para simulação"
            />
          </label>
        </article>

        <article className="bloco-form bloco-com-icone">
          <h3>
            <span className="header-icone"><SettingsIcon className="mini-icon" /></span>
            4. Configurações da trilha
          </h3>

          <div className="duas-colunas">
            <fieldset>
              <legend>
                Status <span className="obrigatorio">*</span>
              </legend>
              <label className="radio-linha">
                <input
                  type="radio"
                  name="status"
                  checked={form.status === 'rascunho'}
                  onChange={() => atualizarCampo('status', 'rascunho')}
                />
                <span>
                  <strong>Rascunho</strong>
                  <small>A trilha ficará salva apenas para você.</small>
                </span>
              </label>
              <label className="radio-linha">
                <input
                  type="radio"
                  name="status"
                  checked={form.status === 'publicada'}
                  onChange={() => atualizarCampo('status', 'publicada')}
                />
                <span>
                  <strong>Publicada</strong>
                  <small>A trilha ficará disponível para todos os usuarios comuns.</small>
                </span>
              </label>
            </fieldset>

            <fieldset>
              <legend>
                Visibilidade <span className="obrigatorio">*</span>
              </legend>
              <label className="radio-linha">
                <input
                  type="radio"
                  name="visibilidade"
                  checked={form.visibilidade === 'Pública'}
                  onChange={() => atualizarCampo('visibilidade', 'Pública')}
                />
                <span>
                  <strong>Pública</strong>
                  <small>Qualquer pessoa pode visualizar e se inscrever.</small>
                </span>
              </label>
              <label className="radio-linha">
                <input
                  type="radio"
                  name="visibilidade"
                  checked={form.visibilidade === 'Privada'}
                  onChange={() => atualizarCampo('visibilidade', 'Privada')}
                />
                <span>
                  <strong>Privada</strong>
                  <small>Apenas pessoas autorizadas podem visualizar.</small>
                </span>
              </label>
            </fieldset>
          </div>

          <div className="caixa-info">
            <InfoIcon className="mini-icon" />
            <p>
              Você poderá adicionar módulos, aulas e quizzes após criar a trilha.
              <br />
              Todos os conteúdos podem ser gerenciados na tela de edição da trilha.
            </p>
          </div>
        </article>

        <div className="form-acoes barra-rodape">
          <Link to="/conteudista/trilhas" className="btn-secundario btn-rodape">
            Cancelar
          </Link>
          <button type="submit" className="btn-primario btn-rodape" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar rascunho e continuar'}
          </button>
        </div>
      </form>
    </section>
  );
}

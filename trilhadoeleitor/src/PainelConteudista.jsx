import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeftIcon, BookOpenIcon, PlusIcon, FileTextIcon, TrashIcon, PencilIcon } from './Icons';
import './PainelConteudista.css';

const API_URL = "http://127.0.0.1:8000";

export default function PainelConteudista({ onVoltar, trilhaId }) {
  const [trilhaSelecionada, setTrilhaSelecionada] = useState(trilhaId ? String(trilhaId) : '1');
  const [tipoConteudo, setTipoConteudo] = useState('teoria');
  
  // =========================================================================
  // ESTADOS DO PASSO 3: GERENCIAMENTO DE MÚLTIPLOS MÓDULOS POR TRILHA
  // =========================================================================
  const [modulosExistentes, setModulosExistentes] = useState([]); // Armazena a lista de capítulos da trilha
  const [idModuloEdicao, setIdModuloEdicao] = useState(null); // null = Criando novo módulo, int = Editando módulo existente
  const [titulo, setTitulo] = useState('');
  const [blocos, setBlocos] = useState([{ tipo: 'texto', valor: '', ordem: 0 }]);

  // Estados do fluxo de Quiz (CRUD Completo Preservado)
  const [perguntasExistentes, setPerguntasExistentes] = useState([]);
  const [idPerguntaEdicao, setIdPerguntaEdicao] = useState(null); 
  const [enunciado, setEnunciado] = useState('');
  const [altA, setAltA] = useState('');
  const [altB, setAltB] = useState('');
  const [altC, setAltC] = useState('');
  const [altD, setAltD] = useState('');
  const [gabarito, setGabarito] = useState('A');

  // Carrega reativamente os capítulos/módulos teóricos da trilha selecionada
  const carregarModulosTeoria = async () => {
    try {
      const response = await axios.get(`${API_URL}/trilhas/${trilhaSelecionada}/modulos`);
      setModulosExistentes(response.data);
    } catch (error) {
      console.error("Erro ao carregar sumário de módulos:", error);
    }
  };

  // Carrega reativamente as questões do Quiz cadastradas na trilha selecionada
  const carregarPerguntasQuiz = async () => {
    try {
      const response = await axios.get(`${API_URL}/trilhas/${trilhaSelecionada}/quiz`);
      setPerguntasExistentes(response.data);
    } catch (error) {
      console.error("Erro ao listar questões do simulado:", error);
    }
  };

  // Sincronizador de abas e dados baseado na trilha ativa
  useEffect(() => {
    if (tipoConteudo === 'teoria') {
      carregarModulosTeoria();
      handleLimparCamposTeoria();
    } else if (tipoConteudo === 'quiz') {
      carregarPerguntasQuiz();
      handleLimparCamposQuiz();
    }
  }, [trilhaSelecionada, tipoConteudo]);

  // =========================================================================
  // INTERATIVIDADES E MANIPULADORES DO FLUXO DE TEORIA (EDITOR EM BLOCOS)
  // =========================================================================
  
  const handleAdicionarBloco = (tipo) => {
    setBlocos([...blocos, { tipo, valor: '', ordem: blocos.length }]);
  };

  const handleAlterarBlocoValor = (index, valor) => {
    const novosBlocos = [...blocos];
    novosBlocos[index].valor = valor;
    setBlocos(novosBlocos);
  };

  const handleRemoverBloco = (index) => {
    const filtrados = blocos.filter((_, i) => i !== index).map((b, i) => ({ ...b, ordem: i }));
    setBlocos(filtrados.length > 0 ? filtrados : [{ tipo: 'texto', valor: '', ordem: 0 }]);
  };

  const handleUploadImagemBloco = async (index, evento) => {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;
    const dadosFormulario = new FormData();
    dadosFormulario.append('file', arquivo);
    try {
      const response = await axios.post(`${API_URL}/trilhas/upload-imagem`, dadosFormulario, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      handleAlterarBlocoValor(index, response.data.url_imagem);
      alert("Upload realizado! Imagem do computador injetada com sucesso.");
    } catch (error) { 
      alert("Erro técnico ao processar o arquivo físico."); 
    }
  };

  const handleCarregarModuloParaEditar = (modulo) => {
    setIdModuloEdicao(modulo.id);
    setTitulo(modulo.titulo);
    setBlocos(modulo.blocos.length > 0 ? modulo.blocos : [{ tipo: 'texto', valor: '', ordem: 0 }]);
  };

  const handleExcluirModuloTeoria = async (moduloId) => {
    if (window.confirm("Deseja realmente excluir este módulo teórico? Todos os seus blocos serão apagados.")) {
      try {
        await axios.delete(`${API_URL}/modulos/${moduloId}`);
        alert("Módulo teórico removido com sucesso!");
        carregarModulosTeoria();
        if (idModuloEdicao === moduloId) handleLimparCamposTeoria();
      } catch (error) {
        alert("Erro ao remover o módulo selecionado.");
      }
    }
  };

  const handleLimparCamposTeoria = () => {
    setIdModuloEdicao(null);
    setTitulo('');
    setBlocos([{ tipo: 'texto', valor: '', ordem: 0 }]);
  };

  // =========================================================================
  // INTERATIVIDADES E MANIPULADORES DO FLUXO DE QUIZ (EDITAR / EXCLUIR)
  // =========================================================================
  
  const handleCarregarParaEditarQuiz = (q) => {
    setIdPerguntaEdicao(q.id);
    setEnunciado(q.enunciado);
    setAltA(q.alternativa_a);
    setAltB(q.alternativa_b);
    setAltC(q.alternativa_c);
    setAltD(q.alternativa_d);
    setGabarito(q.resposta_correta);
  };

  const handleExcluirPerguntaQuiz = async (id) => {
    if (window.confirm("Deseja realmente deletar esta questão do simulado?")) {
      try {
        await axios.delete(`${API_URL}/quiz/${id}`);
        alert("Questão removida com sucesso!");
        carregarPerguntasQuiz();
        if (idPerguntaEdicao === id) handleLimparCamposQuiz();
      } catch (error) { 
        alert("Erro ao excluir questão."); 
      }
    }
  };

  const handleLimparCamposQuiz = () => {
    setIdPerguntaEdicao(null);
    setEnunciado(''); setAltA(''); setAltB(''); setAltC(''); setAltD(''); setGabarito('A');
  };

  // =========================================================================
  // SUBMISSÃO UNIFICADA DOS FORMULÁRIOS PEDAGÓGICOS
  // =========================================================================
  
  const handleSalvarConteudo = async (e) => {
    e.preventDefault();
    try {
      if (tipoConteudo === 'teoria') {
        if (!titulo.trim()) { 
          alert("Por favor, preencha o título do capítulo."); 
          return; 
        }

        const payloadTeoria = {
          id: idModuloEdicao, // Passa o ID se for edição, senão vai null para cadastrar novo
          trilha_id: parseInt(trilhaSelecionada),
          titulo: titulo.trim(),
          blocos: blocos.filter(b => b.valor.trim() !== '')
        };
        
        await axios.post(`${API_URL}/trilhas/${trilhaSelecionada}/teoria`, payloadTeoria);
        alert(idModuloEdicao ? "Módulo didático atualizado com sucesso!" : "Novo módulo pedagógico anexado à trilha!");
        handleLimparCamposTeoria();
        carregarModulosTeoria();
      } 
      else if (tipoConteudo === 'quiz') {
        if (!enunciado.trim() || !altA.trim() || !altB.trim() || !altC.trim() || !altD.trim()) {
          alert("Preencha o enunciado e as 4 alternativas do Quiz.");
          return;
        }

        const payloadQuiz = {
          trilha_id: parseInt(trilhaSelecionada),
          enunciado: enunciado.trim(),
          alternativa_a: altA.trim(),
          alternativa_b: altB.trim(),
          alternativa_c: altC.trim(),
          alternativa_d: altD.trim(),
          resposta_correta: gabarito
        };

        if (idPerguntaEdicao) {
          await axios.put(`${API_URL}/quiz/${idPerguntaEdicao}`, payloadQuiz);
          alert("Questão atualizada com sucesso no banco!");
        } else {
          await axios.post(`${API_URL}/trilhas/${trilhaSelecionada}/quiz`, payloadQuiz);
          alert("Nova questão adicionada!");
        }
        
        handleLimparCamposQuiz();
        carregarPerguntasQuiz();
      }
    } catch (error) { 
      alert("Erro ao sincronizar dados com o banco SQLite."); 
    }
  };

  return (
    <div className="painel-page">
      <header className="painel-header">
        <div className="header-left">
          <button className="icon-button" onClick={onVoltar} title="Voltar para o gerenciador"><ArrowLeftIcon /></button>
          <div className="header-titles">
            <h1 className="header-title">Editor Pedagógico de Mídias e Quizzes</h1>
            <p className="header-subtitle">Trilha Ativa ID: {trilhaSelecionada}</p>
          </div>
        </div>
      </header>

      <main className="painel-main">
        <section className="painel-card">
          <h3 className="section-title"><PlusIcon /> Painel de Criação e Ajustes</h3>
          <form onSubmit={handleSalvarConteudo} className="conteudo-form">
            <div className="form-row">
              <div className="field flex-1">
                <label className="field-label">Trilha Alvo</label>
                <div className="field-input select-wrapper">
                  <select value={trilhaSelecionada} onChange={(e) => setTrilhaSelecionada(e.target.value)} disabled={!!trilhaId}>
                    <option value="1">Urna Eletrônica</option>
                    <option value="2">Processo Eleitoral</option>
                    <option value="3">Combate às Fake News</option>
                  </select>
                </div>
              </div>
              <div className="field flex-1">
                <label className="field-label">Seção Organizacional</label>
                <div className="field-input select-wrapper">
                  <select value={tipoConteudo} onChange={(e) => setTipoConteudo(e.target.value)}>
                    <option value="teoria">Módulos de Teoria Intercalada</option>
                    <option value="quiz">Caderno de Questões do Quiz</option>
                  </select>
                </div>
              </div>
            </div>

            {/* =========================================================================
               ABA DE CONSTRUÇÃO DE MÚLTIPLOS MÓDULOS DE TEORIA
               ========================================================================= */}
            {tipoConteudo === 'teoria' && (
              <>
                <div className="field">
                  <label className="field-label">
                    {idModuloEdicao ? "📝 Editando Módulo ID: " + idModuloEdicao : "➕ Novo Capítulo/Módulo Teórico"}
                  </label>
                  <div className="field-input">
                    <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Módulo 1 - Introdução aos Sistemas Seguros" />
                  </div>
                </div>

                <div className="field">
                  <label className="field-label" style={{ marginBottom: '10px' }}>Blocos Integrados da Aula</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {blocos.map((bloco, index) => (
                      <div key={index} style={{ borderLeft: '3px solid #2563eb', paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', textAlign: 'left' }}>Bloco {index + 1} - {bloco.tipo}</span>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          {bloco.tipo === 'texto' && <div className="field-textarea" style={{ flex: 1 }}><textarea value={bloco.valor} onChange={(e) => handleAlterarBlocoValor(index, e.target.value)} placeholder="Escreva o parágrafo explicativo..." rows="3" /></div>}
                          {bloco.tipo === 'imagem' && (
                            <div className="field-input" style={{ flex: 1, gap: '10px' }}>
                              <input type="text" value={bloco.valor} onChange={(e) => handleAlterarBlocoValor(index, e.target.value)} placeholder="URL do link ou envie um arquivo local" />
                              <label className="nav-btn" style={{ height: '34px', padding: '0 12px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>📁 Upload<input type="file" accept="image/*" onChange={(e) => handleUploadImagemBloco(index, e)} style={{ display: 'none' }} /></label>
                            </div>
                          )}
                          {bloco.tipo === 'video' && <div className="field-input" style={{ flex: 1 }}><input type="text" value={bloco.valor} onChange={(e) => handleAlterarBlocoValor(index, e.target.value)} placeholder="URL do link de vídeo complementar" /></div>}
                          <button type="button" className="icon-button" style={{ color: '#ef4444' }} onClick={() => handleRemoverBloco(index)}><TrashIcon /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px', background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px dashed #cbd5e1', justifyContent: 'center' }}>
                    <button type="button" className="conteudista-btn" style={{ background: '#1e3a8a' }} onClick={() => handleAdicionarBloco('texto')}>+ Texto</button>
                    <button type="button" className="conteudista-btn" style={{ background: '#1e3a8a' }} onClick={() => handleAdicionarBloco('imagem')}>+ Imagem</button>
                    <button type="button" className="conteudista-btn" style={{ background: '#1e3a8a' }} onClick={() => handleAdicionarBloco('video')}>+ Vídeo</button>
                  </div>
                </div>
              </>
            )}

            {/* ABA DE CONSTRUÇÃO DO CADERNO DE QUESTÕES DO QUIZ */}
            {tipoConteudo === 'quiz' && (
              <>
                <div className="field">
                  <label className="field-label">{idPerguntaEdicao ? "📝 Editando Questão ID: " + idPerguntaEdicao : "➕ Nova Questão do Simulado"}</label>
                  <div className="field-textarea"><textarea value={enunciado} onChange={(e) => setEnunciado(e.target.value)} placeholder="Digite o enunciado da pergunta..." rows="3" /></div>
                </div>
                <div className="form-row">
                  <div className="field flex-1"><label className="field-label">Alternativa A</label><div className="field-input"><input type="text" value={altA} onChange={(e) => setAltA(e.target.value)} placeholder="Opção A" /></div></div>
                  <div className="field flex-1"><label className="field-label">Alternativa B</label><div className="field-input"><input type="text" value={altB} onChange={(e) => setAltB(e.target.value)} placeholder="Opção B" /></div></div>
                </div>
                <div className="form-row">
                  <div className="field flex-1"><label className="field-label">Alternativa C</label><div className="field-input"><input type="text" value={altC} onChange={(e) => setAltC(e.target.value)} placeholder="Opção C" /></div></div>
                  <div className="field flex-1"><label className="field-label">Alternativa D</label><div className="field-input"><input type="text" value={altD} onChange={(e) => setAltD(e.target.value)} placeholder="Opção D" /></div></div>
                </div>
                <div className="form-row" style={{ alignItems: 'flex-end' }}>
                  <div className="field flex-1">
                    <label className="field-label">Gabarito Oficial</label>
                    <div className="field-input select-wrapper">
                      <select value={gabarito} onChange={(e) => setGabarito(e.target.value)} style={{ cursor: 'pointer' }}>
                        <option value="A">Opção A Correta</option><option value="B">Opção B Correta</option><option value="C">Opção C Correta</option><option value="D">Opção D Correta</option>
                      </select>
                    </div>
                  </div>
                  {idPerguntaEdicao && (
                    <button type="button" className="nav-btn" onClick={handleLimparCamposQuiz} style={{ height: '42px', color: '#ef4444', borderColor: '#ef4444' }}>Cancelar</button>
                  )}
                </div>
              </>
            )}

            <div className="actions-row">
              <button type="submit" className="btn-primary btn-save">
                {tipoConteudo === 'teoria' && idModuloEdicao ? "Salvar Alterações do Capítulo" : tipoConteudo === 'quiz' && idPerguntaEdicao ? "Salvar Alterações da Pergunta" : "Publicar na Trilha"}
              </button>
              {tipoConteudo === 'teoria' && idModuloEdicao && (
                <button type="button" className="nav-btn" onClick={handleLimparCamposTeoria} style={{ flex: 1, height: '45px', borderColor: '#64748b' }}>Criar Novo Capítulo</button>
              )}
              <button type="button" className="btn-outline btn-cancel" onClick={onVoltar}>Voltar</button>
            </div>
          </form>
        </section>

        {/* =========================================================================
           BLOCO HISTÓRICO 1: EXIBE SUMÁRIO DE MÚLTIPLOS MÓDULOS DE TEORIA GRAVADOS
           ========================================================================= */}
        {tipoConteudo === 'teoria' && (
          <section className="painel-card" style={{ marginTop: '16px' }}>
            <h3 className="section-title" style={{ color: '#475569' }}><BookOpenIcon /> Capítulos / Módulos desta Trilha ({modulosExistentes.length})</h3>
            {modulosExistentes.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', margin: '20px 0' }}>Nenhum capítulo teórico criado para esta trilha ainda.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {modulosExistentes.map((mod, idx) => (
                  <div key={mod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ textAlign: 'left', flex: 1, paddingRight: '12px' }}>
                      <p style={{ margin: '0', fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>Capítulo {idx + 1}: {mod.titulo}</p>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Contém {mod.blocos.length} elementos de mídia intercalados</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" className="icon-button" style={{ color: '#475569', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', width: '28px', height: '28px' }} onClick={() => handleCarregarModuloParaEditar(mod)} title="Editar Capítulo"><PencilIcon style={{ width: '12px', height: '12px' }} /></button>
                      <button type="button" className="icon-button" style={{ color: '#ef4444', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', width: '28px', height: '28px' }} onClick={() => handleExcluirModuloTeoria(mod.id)} title="Excluir Capítulo"><TrashIcon style={{ width: '12px', height: '12px' }} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* BLOCO HISTÓRICO 2: HISTÓRICO DE QUESTÕES DO QUIZ */}
        {tipoConteudo === 'quiz' && (
          <section className="painel-card" style={{ marginTop: '16px' }}>
            <h3 className="section-title" style={{ color: '#475569' }}><FileTextIcon /> Questões Cadastradas no Banco ({perguntasExistentes.length})</h3>
            {perguntasExistentes.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', margin: '20px 0' }}>Nenhuma questão cadastrada para esta trilha ainda.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {perguntasExistentes.map((q, idx) => (
                  <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ textAlign: 'left', flex: 1, paddingRight: '12px' }}>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{idx + 1}. {q.enunciado}</p>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a', background: '#f0fdf4', padding: '2px 6px', borderRadius: '4px' }}>Gabarito: {q.resposta_correta}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" className="icon-button" style={{ color: '#475569', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', width: '28px', height: '28px' }} onClick={() => handleCarregarParaEditarQuiz(q)} title="Editar Pergunta"><PencilIcon style={{ width: '12px', height: '12px' }} /></button>
                      <button type="button" className="icon-button" style={{ color: '#ef4444', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', width: '28px', height: '28px' }} onClick={() => handleExcluirPerguntaQuiz(q.id)} title="Excluir Pergunta"><TrashIcon style={{ width: '12px', height: '12px' }} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
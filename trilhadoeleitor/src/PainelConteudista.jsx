import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeftIcon, BookOpenIcon, PlusIcon, FileTextIcon, TrashIcon } from './Icons';
import './PainelConteudista.css';

const API_URL = "http://127.0.0.1:8000";

export default function PainelConteudista({ onVoltar, trilhaId }) {
  const [trilhaSelecionada, setTrilhaSelecionada] = useState(trilhaId ? String(trilhaId) : '1');
  const [tipoConteudo, setTipoConteudo] = useState('teoria');
  
  // Estados do fluxo de Teoria em Blocos Intercalados
  const [titulo, setTitulo] = useState('');
  const [blocos, setBlocos] = useState([{ tipo: 'texto', valor: '', ordem: 0 }]);

  // Estados do fluxo de Quiz (Cadastrar Questões Reais)
  const [enunciado, setEnunciado] = useState('');
  const [altA, setAltA] = useState('');
  const [altB, setAltB] = useState('');
  const [altC, setAltC] = useState('');
  const [altD, setAltD] = useState('');
  const [gabarito, setGabarito] = useState('A');

  // Recupera e pré-carrega os blocos pedagógicos existentes do banco se for uma reedição (Lápis)
  useEffect(() => {
    if (!trilhaId || tipoConteudo !== 'teoria') return;

    async function buscarDadosExistentes() {
      try {
        const response = await axios.get(`${API_URL}/trilhas/${trilhaId}/teoria`);
        setTitulo(response.data.titulo || '');
        setBlocos(response.data.blocos.length > 0 ? response.data.blocos : [{ tipo: 'texto', valor: '', ordem: 0 }]);
      } catch (error) {
        // Erro 404 indica trilha vazia sem material gravado, reinicializamos com um bloco em branco
        setTitulo(''); 
        setBlocos([{ tipo: 'texto', valor: '', ordem: 0 }]);
      }
    }
    buscarDadosExistentes();
  }, [trilhaId, tipoConteudo]);

  // Função para adicionar um novo bloco sequencial (Texto, Imagem ou Vídeo)
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

  // Envia o arquivo físico do computador para a pasta 'uploads' e recupera a URL estática gerada
  const handleUploadImagemBloco = async (index, evento) => {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;

    const dadosFormulario = new FormData();
    dadosFormulario.append('file', arquivo);

    try {
      const response = await axios.post(`${API_URL}/trilhas/upload-imagem`, dadosFormulario, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Injeta a URL estática vinda do FastAPI direto na caixa de texto do bloco correspondente
      handleAlterarBlocoValor(index, response.data.url_imagem);
      alert("Upload realizado! Imagem do computador injetada com sucesso.");
    } catch (error) {
      alert("Erro técnico ao processar o envio do arquivo físico.");
    }
  };

  const handleSalvarConteudo = async (e) => {
    e.preventDefault();
    try {
      if (tipoConteudo === 'teoria') {
        if (!titulo.trim()) { 
          alert("Por favor, preencha o título do módulo teórico."); 
          return; 
        }

        // Filtra para mandar apenas blocos que possuam dados escritos, descartando vazios indesejados
        const payloadTeoria = {
          trilha_id: parseInt(trilhaSelecionada),
          titulo: titulo.trim(),
          blocos: blocos.filter(b => b.valor.trim() !== '')
        };
        
        await axios.post(`${API_URL}/trilhas/${trilhaSelecionada}/teoria`, payloadTeoria);
        alert("Estrutura de blocos intercalados gravada com sucesso no banco!");
      } 
      else if (tipoConteudo === 'quiz') {
        if (!enunciado.trim() || !altA.trim() || !altB.trim() || !altC.trim() || !altD.trim()) {
          alert("Por favor, preencha o enunciado e todas as 4 alternativas.");
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

        await axios.post(`${API_URL}/trilhas/${trilhaSelecionada}/quiz`, payloadQuiz);
        alert("Questão avaliativa integrada ao banco de dados com sucesso!");
        
        // Limpa o caderno de inputs do quiz para facilitar a digitação da próxima pergunta sequencial
        setEnunciado(''); 
        setAltA(''); 
        setAltB(''); 
        setAltC(''); 
        setAltD(''); 
        setGabarito('A');
      }
    } catch (error) { 
      alert("Erro na persistência dos dados pedagógicos."); 
    }
  };

  return (
    <div className="painel-page">
      <header className="painel-header">
        <div className="header-left">
          <button className="icon-button" onClick={onVoltar} title="Voltar para o gerenciador"><ArrowLeftIcon /></button>
          <div className="header-titles">
            <h1 className="header-title">Editor de Aula em Blocos Intercalados</h1>
            <p className="header-subtitle">Trilha Alvo ID: {trilhaSelecionada}</p>
          </div>
        </div>
      </header>

      <main className="painel-main">
        <section className="painel-card">
          <h3 className="section-title"><PlusIcon /> Construtor de Aprendizado</h3>
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
                <label className="field-label">Seção Educativa</label>
                <div className="field-input select-wrapper">
                  <select value={tipoConteudo} onChange={(e) => setTipoConteudo(e.target.value)}>
                    <option value="teoria">Teoria em Blocos Intercalados</option>
                    <option value="quiz">Quiz (Cadastrar Questões)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* FORMULÁRIO DINÂMICO DA CONSTRUÇÃO DE BLOCOS DA TEORIA (TEXTO + ARQUIVOS) */}
            {tipoConteudo === 'teoria' && (
              <>
                <div className="field">
                  <label className="field-label">Título do Módulo Teórico</label>
                  <div className="field-input">
                    <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Criptografia e Segurança Computacional" />
                  </div>
                </div>

                <div className="field">
                  <label className="field-label" style={{ marginBottom: '12px' }}>Linha do Tempo de Blocos (Mídias Intercaladas)</label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {blocos.map((bloco, index) => (
                      <div key={index} style={{ borderLeft: '3px solid #2563eb', paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', textAlign: 'left' }}>
                          Elemento {index + 1} • {bloco.tipo === 'texto' ? 'Texto Corrente' : bloco.tipo === 'imagem' ? 'Imagem Ilustrativa' : 'Link Audiovisual'}
                        </span>
                        
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          {bloco.tipo === 'texto' && (
                            <div className="field-textarea" style={{ flex: 1 }}>
                              <textarea value={bloco.valor} onChange={(e) => handleAlterarBlocoValor(index, e.target.value)} placeholder="Digite o parágrafo explicativo deste trecho do artigo pedagógico..." rows="3" />
                            </div>
                          )}

                          {bloco.tipo === 'imagem' && (
                            <div className="field-input" style={{ flex: 1, gap: '10px' }}>
                              <input type="text" value={bloco.valor} onChange={(e) => handleAlterarBlocoValor(index, e.target.value)} placeholder="Cole o link da internet OU envie uma foto do computador..." />
                              <label className="nav-btn" style={{ height: '34px', padding: '0 12px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                📁 Enviar Foto
                                <input type="file" accept="image/*" onChange={(e) => handleUploadImagemBloco(index, e)} style={{ display: 'none' }} />
                              </label>
                            </div>
                          )}

                          {bloco.tipo === 'video' && (
                            <div className="field-input" style={{ flex: 1 }}>
                              <input type="text" value={bloco.valor} onChange={(e) => handleAlterarBlocoValor(index, e.target.value)} placeholder="Cole aqui a URL/link do vídeo complementar de apoio (Ex: YouTube)" />
                            </div>
                          )}

                          {/* Exibe o botão de lixeira apenas se houver mais de um bloco */}
                          <button type="button" className="icon-button" style={{ color: '#ef4444' }} onClick={() => handleRemoverBloco(index)}><TrashIcon /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Barra Centralizada de Controle de Mídias Intercaladas */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '18px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px dashed #cbd5e1', justifyContent: 'center' }}>
                    <button type="button" className="conteudista-btn" style={{ background: '#1e3a8a' }} onClick={() => handleAdicionarBloco('texto')}>+ Bloco Texto</button>
                    <button type="button" className="conteudista-btn" style={{ background: '#1e3a8a' }} onClick={() => handleAdicionarBloco('imagem')}>+ Bloco Imagem</button>
                    <button type="button" className="conteudista-btn" style={{ background: '#1e3a8a' }} onClick={() => handleAdicionarBloco('video')}>+ Bloco Vídeo</button>
                  </div>
                </div>
              </>
            )}

            {/* FORMULÁRIO DINÂMICO PARA COMPOSIÇÃO DO CADERNO DE QUESTÕES DO QUIZ */}
            {tipoConteudo === 'quiz' && (
              <>
                <div className="field">
                  <label className="field-label">Enunciado da Questão Avaliativa</label>
                  <div className="field-textarea">
                    <textarea value={enunciado} onChange={(e) => setEnunciado(e.target.value)} placeholder="Digite o enunciado da pergunta de múltipla escolha..." rows="4" />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="field flex-1">
                    <label className="field-label">Alternativa A</label>
                    <div className="field-input"><input type="text" value={altA} onChange={(e) => setAltA(e.target.value)} placeholder="Texto da opção A" /></div>
                  </div>
                  <div className="field flex-1">
                    <label className="field-label">Alternativa B</label>
                    <div className="field-input"><input type="text" value={altB} onChange={(e) => setAltB(e.target.value)} placeholder="Texto da opção B" /></div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="field flex-1">
                    <label className="field-label">Alternativa C</label>
                    <div className="field-input"><input type="text" value={altC} onChange={(e) => setAltC(e.target.value)} placeholder="Texto da opção C" /></div>
                  </div>
                  <div className="field flex-1">
                    <label className="field-label">Alternativa D</label>
                    <div className="field-input"><input type="text" value={altD} onChange={(e) => setAltD(e.target.value)} placeholder="Texto da opção D" /></div>
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Gabarito Oficial (Resposta Correta)</label>
                  <div className="field-input select-wrapper">
                    <select value={gabarito} onChange={(e) => setGabarito(e.target.value)}>
                      <option value="A">Alternativa A é a Correta</option>
                      <option value="B">Alternativa B é a Correta</option>
                      <option value="C">Alternativa C é a Correta</option>
                      <option value="D">Alternativa D é a Correta</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="actions-row">
              <button type="submit" className="btn-primary btn-save">Publicar na Trilha</button>
              <button type="button" className="btn-outline btn-cancel" onClick={onVoltar}>Voltar</button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
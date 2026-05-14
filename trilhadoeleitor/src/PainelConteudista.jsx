import { useState } from 'react';
import axios from 'axios';
import { ArrowLeftIcon, BookOpenIcon, PlusIcon, FileTextIcon } from './Icons';
import './PainelConteudista.css';

const API_URL = "http://127.0.0.1:8000";

export default function PainelConteudista({ onVoltar }) {
  const [trilhaSelecionada, setTrilhaSelecionada] = useState('urna');
  const [tipoConteudo, setTipoConteudo] = useState('teoria');
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');

  const handleSalvarConteudo = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !corpo.trim()) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    try {
      const payload = {
        trilha_id: trilhaSelecionada,
        tipo: tipoConteudo,
        titulo: titulo.trim(),
        conteudo: corpo.trim()
      };
      
      // Rota genérica fictícia pronta para integração posterior no backend
      await axios.post(`${API_URL}/conteudo/criar`, payload);
      alert("Conteúdo publicado com sucesso!");
      
      setTitulo('');
      setCorpo('');
    } catch (error) {
      alert("Erro ao publicar: " + (error.response?.data?.detail || "Erro no servidor"));
    }
  };

  return (
    <div className="painel-page">
      <header className="painel-header">
        <div className="header-left">
          <button className="icon-button" onClick={onVoltar} title="Voltar para Home">
            <ArrowLeftIcon />
          </button>
          <div className="header-titles">
            <h1 className="header-title">Painel do Conteudista</h1>
            <p className="header-subtitle">Gerencie e publique materiais educativos</p>
          </div>
        </div>
      </header>

      <main className="painel-main">
        {/* Cards de Métricas */}
        <section className="metrics-row">
          <div className="metric-card">
            <div className="metric-icon blue"><BookOpenIcon /></div>
            <div className="metric-info">
              <span className="metric-value">3</span>
              <span className="metric-label">Trilhas Ativas</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon green"><FileTextIcon /></div>
            <div className="metric-info">
              <span className="metric-value">0</span>
              <span className="metric-label">Aulas Publicadas</span>
            </div>
          </div>
        </section>

        {/* Formulário de Criação */}
        <section className="painel-card">
          <h3 className="section-title"><PlusIcon /> Criar Novo Conteúdo</h3>
          
          <form onSubmit={handleSalvarConteudo} className="conteudo-form">
            <div className="form-row">
              <div className="field flex-1">
                <label className="field-label">Selecionar Trilha</label>
                <div className="field-input select-wrapper">
                  <select 
                    value={trilhaSelecionada} 
                    onChange={(e) => setTrilhaSelecionada(e.target.value)}
                  >
                    <option value="urna">Urna Eletrônica</option>
                    <option value="processo">Processo Eleitoral</option>
                    <option value="fakenews">Combate às Fake News</option>
                  </select>
                </div>
              </div>

              <div className="field flex-1">
                <label className="field-label">Tipo de Seção</label>
                <div className="field-input select-wrapper">
                  <select 
                    value={tipoConteudo} 
                    onChange={(e) => setTipoConteudo(e.target.value)}
                  >
                    <option value="teoria">Teoria (Leitura)</option>
                    <option value="quiz">Quiz (Questões)</option>
                    <option value="pratica">Prática (Exercício)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="field">
              <label className="field-label">Título do Tópico</label>
              <div className="field-input">
                <input 
                  type="text" 
                  value={titulo} 
                  onChange={(e) => setTitulo(e.target.value)} 
                  placeholder="Ex: Introdução ao Voto Seguro" 
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Corpo do Conteúdo / Pergunta do Quiz</label>
              <div className="field-textarea">
                <textarea 
                  value={corpo} 
                  onChange={(e) => setCorpo(e.target.value)} 
                  placeholder="Insira o texto explicativo em Markdown/HTML ou a estrutura de perguntas..." 
                  rows="8"
                  required
                ></textarea>
              </div>
            </div>

            <div className="actions-row">
              <button type="submit" className="btn-primary btn-save">Publicar na Trilha</button>
              <button type="button" className="btn-outline btn-cancel" onClick={onVoltar}>Cancelar</button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
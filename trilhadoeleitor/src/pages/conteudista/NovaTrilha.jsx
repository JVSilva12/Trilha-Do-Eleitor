import { useState } from 'react'; 
import NivelCard from '../../components/Trilhas/NivelCard'; 
import { categoriasTrilha, niveisTrilha } from '../../data/trilhasMock'; 
import { criarTrilha } from '../../services/trilhasService'; 
import { BookmarkIcon, InfoIcon, SaveIcon, SettingsIcon, UploadCloudIcon } from '../../components/Trilhas/TrilhaIcons'; 
import '../../styles/trilhas.css';

const niveisDescricao = { 
  'Básico': 'Conteúdo introdutório', 
  'Intermediário': 'Conteúdo aprofundado', 
  'Avançado': 'Conteúdo especializado' 
}; 

export default function NovaTrilha({ onVoltar }) { 
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
     await criarTrilha(payload); 
     alert("Trilha criada com sucesso como rascunho!");
     onVoltar(); // Retorna ao gerenciador por estado local
   } catch (error) { 
     alert(error.response?.data?.detail || 'Não foi possível criar a trilha.'); 
   } finally { 
     setSalvando(false); 
   } 
 }; 

 return (
   <div className="home-page" style={{ overflowY: 'auto' }}>
     <div className="home-banner" />
     <main className="home-main" style={{ maxWidth: '800px', margin: '0 auto', padding: '30px 20px' }}>
       <button onClick={onVoltar} className="nav-btn" style={{ marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}> 
         ← Voltar para o gerenciador
       </button> 

       <div className="welcome-section" style={{ marginBottom: '24px' }}> 
         <h2>Nova Trilha Educativa</h2> 
         <p>Preencha os critérios abaixo para disponibilizar um novo fluxo de estudos na plataforma.</p> 
       </div> 

       <form className="form-trilha" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}> 
         <article className="perfil-card" style={{ padding: '20px' }}> 
           <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e3a8a', fontSize: '16px', marginBottom: '16px' }}> 
             <SaveIcon className="mini-icon" /> 1. Informações básicas 
           </h3> 
           
           <div className="field" style={{ marginBottom: '14px' }}>
             <label className="field-label">Nome da trilha <span style={{ color: '#ef4444' }}>*</span></label>
             <div className="field-input">
               <input 
                 type="text" 
                 maxLength={100} 
                 value={form.nome} 
                 onChange={(evento) => atualizarCampo('nome', evento.target.value)} 
                 placeholder="Ex.: Como funcionam as eleições" 
                 required 
                 style={{ width: '100%', border: 0, outline: 0 }}
               /> 
             </div>
             <small style={{ display: 'block', textAlign: 'right', color: '#64748b', fontSize: '11px', marginTop: '4px' }}>{form.nome.length}/100</small> 
           </div>

           <div className="field">
             <label className="field-label">Descrição curta <span style={{ color: '#ef4444' }}>*</span></label>
             <div style={{ display: 'flex', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#fff' }}>
               <textarea 
                 maxLength={300} 
                 value={form.descricao} 
                 onChange={(evento) => atualizarCampo('descricao', evento.target.value)} 
                 placeholder="Descreva de forma breve o que os eleitores irão aprender..." 
                 required 
                 rows="4"
                 style={{ width: '100%', border: 0, outline: 0, resize: 'none', fontSize: '13px', fontFamily: 'inherit' }}
               /> 
             </div>
             <small style={{ display: 'block', textAlign: 'right', color: '#64748b', fontSize: '11px', marginTop: '4px' }}>{form.descricao.length}/300</small> 
           </div>
         </article> 

         <article className="perfil-card" style={{ padding: '20px' }}> 
           <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e3a8a', fontSize: '16px', marginBottom: '16px' }}> 
             <BookmarkIcon className="mini-icon" /> 2. Categoria e nível 
           </h3> 
           <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}> 
             <div className="field flex-1"> 
               <label className="field-label">Categoria <span style={{ color: '#ef4444' }}>*</span></label> 
               <div className="field-input">
                 <select value={form.categoria} onChange={(evento) => atualizarCampo('categoria', evento.target.value)} required style={{ width: '100%', border: 0, outline: 0, background: 'transparent' }}> 
                   <option value="">Selecione uma categoria</option> 
                   {categoriasTrilha.map((cat) => ( <option key={cat} value={cat}>{cat}</option> ))} 
                 </select> 
               </div>
             </div> 
             <div className="field flex-1"> 
               <label className="field-label">Nível de dificuldade <span style={{ color: '#ef4444' }}>*</span></label> 
               <div className="field-input">
                 <select value={form.nivel} onChange={(evento) => atualizarCampo('nivel', evento.target.value)} required style={{ width: '100%', border: 0, outline: 0, background: 'transparent' }}> 
                   <option value="">Selecione o nível</option> 
                   {niveisTrilha.map((niv) => ( <option key={niv} value={niv}>{niv}</option> ))} 
                 </select> 
               </div>
             </div> 
           </div> 
           <div className="niveis-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}> 
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

         <article className="perfil-card" style={{ padding: '20px' }}> 
           <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e3a8a', fontSize: '16px', marginBottom: '12px' }}> 
             <UploadCloudIcon className="mini-icon" /> 3. Imagem de capa 
           </h3> 
           <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>A imagem será exibida nos banners e miniaturas do card.</p> 
           <div className="field">
             <div className="field-input">
               <UploadCloudIcon style={{ marginRight: '8px', color: '#94a3b8' }} />
               <input 
                 type="text" 
                 value={form.imagem} 
                 onChange={(evento) => atualizarCampo('imagem', evento.target.value)} 
                 placeholder="Cole aqui a URL completa da imagem para simulação" 
                 style={{ width: '100%', border: 0, outline: 0 }}
               /> 
             </div>
           </div>
         </article> 

         <article className="perfil-card" style={{ padding: '20px' }}> 
           <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e3a8a', fontSize: '16px', marginBottom: '16px' }}> 
             <SettingsIcon className="mini-icon" /> 4. Configurações da trilha 
           </h3> 
           <div className="duas-colunas" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}> 
             <fieldset style={{ border: 0, padding: 0, margin: 0, flex: 1, minWidth: '200px' }}> 
               <legend style={{ fontWeight: 600, fontSize: '14px', marginBottom: '10px' }}>Status <span style={{ color: '#ef4444' }}>*</span></legend> 
               <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px', cursor: 'pointer' }}> 
                 <input type="radio" name="status" checked={form.status === 'rascunho'} onChange={() => atualizarCampo('status', 'rascunho')} style={{ marginTop: '4px' }} /> 
                 <span style={{ fontSize: '13px' }}><strong>Rascunho</strong><br/><small style={{ color: '#64748b' }}>Apenas você poderá ver e editar.</small></span> 
               </label> 
               <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}> 
                 <input type="radio" name="status" checked={form.status === 'publicada'} onChange={() => atualizarCampo('status', 'publicada')} style={{ marginTop: '4px' }} /> 
                 <span style={{ fontSize: '13px' }}><strong>Publicada</strong><br/><small style={{ color: '#64748b' }}>Disponível imediatamente aos eleitores.</small></span> 
               </label> 
             </fieldset> 
             <fieldset style={{ border: 0, padding: 0, margin: 0, flex: 1, minWidth: '200px' }}> 
               <legend style={{ fontWeight: 600, fontSize: '14px', marginBottom: '10px' }}>Visibilidade <span style={{ color: '#ef4444' }}>*</span></legend> 
               <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px', cursor: 'pointer' }}> 
                 <input type="radio" name="visibilidade" checked={form.visibilidade === 'Pública'} onChange={() => atualizarCampo('visibilidade', 'Pública')} style={{ marginTop: '4px' }} /> 
                 <span style={{ fontSize: '13px' }}><strong>Pública</strong><br/><small style={{ color: '#64748b' }}>Livre acesso para qualquer usuário da plataforma.</small></span> 
               </label> 
               <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}> 
                 <input type="radio" name="visibilidade" checked={form.visibilidade === 'Privada'} onChange={() => atualizarCampo('visibilidade', 'Privada')} style={{ marginTop: '4px' }} /> 
                 <span style={{ fontSize: '13px' }}><strong>Privada</strong><br/><small style={{ color: '#64748b' }}>Apenas administradores e convidados visualizam.</small></span> 
               </label> 
             </fieldset> 
           </div> 
           <div className="caixa-info" style={{ display: 'flex', gap: '10px', background: '#eff6ff', padding: '12px', borderRadius: '10px', border: '1px solid #bfdbfe', marginTop: '20px', color: '#1e40af', fontSize: '12px' }}> 
             <InfoIcon className="mini-icon" style={{ flexShrink: 0, marginTop: '2px' }} /> 
             <p style={{ margin: 0, lineHeight: 1.5 }}> 
               Você poderá adicionar módulos detalhados, aulas em formato textual, links de vídeos e questionários de fixação (quizzes) após realizar o salvamento inicial desta trilha educativa.
             </p> 
           </div> 
         </article> 
         <div className="actions-row" style={{ marginTop: '10px' }}> 
           <button type="submit" className="btn-primary" disabled={salvando} style={{ flex: 2 }}> 
             {salvando ? 'Processando...' : 'Salvar Trilha e Continuar'} 
           </button> 
           <button type="button" className="btn-outline" onClick={onVoltar} style={{ flex: 1 }}> 
             Cancelar 
           </button> 
         </div> 
       </form> 
     </main>
   </div>
 ); 
}
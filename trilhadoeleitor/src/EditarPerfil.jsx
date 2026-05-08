import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
 UserIcon, 
 MailIcon, 
 LockIcon, 
 ArrowLeftIcon, 
 BellIcon, 
 PhoneIcon, 
 PencilIcon,
 TrashIcon 
} from './Icons';
import './EditarPerfil.css';

export default function EditarPerfil({ emailUsuario, onVoltar }) {
 const [apelido, setApelido] = useState('');
 const [nomeExibicao, setNomeExibicao] = useState('Carregando...');
 const [telefone, setTelefone] = useState('');
 const [email, setEmail] = useState('');
 const [dataCriacao, setDataCriacao] = useState('');
 const [senhaAtual, setSenhaAtual] = useState('');
 const [novaSenha, setNovaSenha] = useState('');
 const [confirmarSenha, setConfirmarSenha] = useState('');
 const [fotoPerfil, setFotoPerfil] = useState(null);
 const fileInputRef = useRef(null);

 const validarSenhaComplexa = (s) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(s);
 };

 useEffect(() => {
   async function carregarPerfil() {
     if (!emailUsuario) return;
     try {
       const response = await axios.get(`http://localhost:8000/perfil/${emailUsuario}`);
       const dados = response.data;
       
       setApelido(dados.apelido || '');
       setNomeExibicao(dados.apelido || 'Utilizador');
       setTelefone(dados.telefone || '');
       setEmail(dados.email || emailUsuario);
       setDataCriacao(dados.data_criacao || '--/--/----');
       
       if (dados.foto_perfil) {
         setFotoPerfil(`http://localhost:8000${dados.foto_perfil}`);
       } else {
         setFotoPerfil(null);
       }
     } catch (error) {
       console.error("Erro ao carregar perfil:", error);
     }
   }
   carregarPerfil();
 }, [emailUsuario]);

 const handleSalvar = async () => {
   if (!apelido || apelido.trim() === '') {
     alert("O campo 'Apelido' é obrigatório e não pode ficar vazio.");
     return;
   }

   if (novaSenha || confirmarSenha || senhaAtual) {
     if (novaSenha !== confirmarSenha) {
       alert("A nova senha e a confirmação não coincidem!");
       return;
     }
     if (!validarSenhaComplexa(novaSenha)) {
       alert("A nova senha deve ter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma minúscula e um número.");
       return;
     }
     if (!senhaAtual) {
       alert("Você precisa digitar a senha atual para definir uma nova.");
       return;
     }
   }

   try {
     const payload = {
       apelido: apelido.trim(),
       email: email,
       telefone: telefone || null,
       senha_atual: senhaAtual || null,
       nova_senha: novaSenha || null 
     };

     await axios.put(`http://localhost:8000/perfil/atualizar/${emailUsuario}`, payload);
     alert("Perfil atualizado com sucesso!");
     
     setNomeExibicao(apelido.trim());
     setSenhaAtual('');
     setNovaSenha('');
     setConfirmarSenha('');
   } catch (error) {
     alert("Erro ao atualizar: " + (error.response?.data?.detail || "Erro no servidor."));
   }
 };

 const handleFileChange = async (event) => {
   const files = event.target.files;
   if (!files || files.length === 0) return;
   
   const formData = new FormData();
   formData.append("file", files[0]);

   try {
     const response = await axios.post(`http://localhost:8000/perfil/${emailUsuario}/foto`, formData, {
       headers: { 'Content-Type': 'multipart/form-data' }
     });
     setFotoPerfil(`http://localhost:8000${response.data.foto_url}`);
   } catch (error) {
     alert("Erro ao enviar foto.");
   }
 };

 const handleRemoverFoto = async () => {
    if (!window.confirm("Deseja realmente remover sua foto de perfil?")) return;
    try {
      await axios.delete(`http://localhost:8000/perfil/${emailUsuario}/foto`);
      setFotoPerfil(null);
      alert("Foto removida!");
    } catch (error) {
      alert("Erro ao remover a foto.");
    }
 };

 const gerarIniciais = (nome) => {
   if (!nome || nome === "Carregando...") return "US";
   const partes = nome.trim().split(" ");
   return partes.length > 1 
     ? (partes[0][0] + partes[1][0]).toUpperCase() 
     : nome.substring(0, 2).toUpperCase();
 };

 return (
  <div className="perfil-page">
    <header className="perfil-header">
      <div className="header-left">
        <button className="icon-button" onClick={onVoltar}><ArrowLeftIcon /></button>
        <div className="header-titles">
          <h1 className="header-title">Editar Perfil</h1>
          <p className="header-subtitle">Atualize suas informações</p>
        </div>
      </div>
      <div className="header-right">
        <button className="icon-button bell-button"><BellIcon /></button>
        <div className="avatar-small">
          {fotoPerfil ? <img src={fotoPerfil} alt="Perfil" /> : gerarIniciais(nomeExibicao)}
        </div>
      </div>
    </header>

    <main className="perfil-main">
      <div className="perfil-card user-info-card">
        <div className="avatar-large-container">
          <div className="avatar-large">
            {fotoPerfil ? <img src={fotoPerfil} alt="Perfil" /> : gerarIniciais(nomeExibicao)}
          </div>
          <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
          <div className="avatar-btns-group">
              <button className="edit-avatar-btn" onClick={() => fileInputRef.current.click()} title="Editar foto"><PencilIcon /></button>
              {fotoPerfil && <button className="remove-avatar-btn" onClick={handleRemoverFoto} title="Remover foto"><TrashIcon /></button>}
          </div>
        </div>
        <div className="user-details">
          <h2 className="user-name">{nomeExibicao}</h2>
          <p className="user-email">{email}</p>
          <span className="user-badge">Conta criada em {dataCriacao}</span>
        </div>
      </div>

      <div className="perfil-card">
        <h3 className="section-title"><UserIcon /> Informações pessoais</h3>
        <div className="form-row">
          <div className="field flex-1">
            <label className="field-label">Apelido</label>
            <div className="field-input">
              <UserIcon />
              <input 
                type="text" 
                value={apelido} 
                onChange={(e) => setApelido(e.target.value)} 
                placeholder="Seu apelido"
              />
            </div>
          </div>
          <div className="field flex-1">
            <label className="field-label">Telefone</label>
            <div className="field-input">
              <PhoneIcon />
              <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </div>
        </div>
        <div className="field">
          <label className="field-label">E-mail</label>
          <div className="field-input"><MailIcon /><input type="email" value={email} disabled /></div>
        </div>
      </div>

      <div className="perfil-card">
        <h3 className="section-title"><LockIcon /> Segurança</h3>
        <div className="form-row">
          <div className="field flex-1">
            <label className="field-label">Senha atual</label>
            <div className="field-input">
              <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} placeholder="Senha atual" />
            </div>
          </div>
          <div className="field flex-1">
            <label className="field-label">Nova senha</label>
            <div className="field-input">
              <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Mínimo 8 caracteres" />
            </div>
          </div>
        </div>
        <div className="field">
          <label className="field-label">Confirmar nova senha</label>
          <div className="field-input">
            <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="Confirme a nova senha" />
          </div>
        </div>
      </div>

      <div className="actions-row">
        <button className="btn-primary btn-save" onClick={handleSalvar}>Salvar alterações</button>
        <button className="btn-outline btn-cancel" onClick={onVoltar}>Cancelar</button>
      </div>
    </main>
  </div>
 );
}
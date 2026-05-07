import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  UserIcon,
  MailIcon,
  LockIcon,
  ArrowLeftIcon,
  BellIcon,
  PhoneIcon,
  PencilIcon
} from './Icons';
import './EditarPerfil.css';

export default function EditarPerfil({ emailUsuario, onVoltar }) {
  const [apelido, setApelido] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('Carregando...');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [notificacoes, setNotificacoes] = useState(true);
  
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function carregarPerfil() {
      if (!emailUsuario) return;
      try {
        const response = await axios.get(`http://localhost:8000/perfil/${emailUsuario}`);
        const dados = response.data;
        
        setApelido(dados.apelido || '');
        setNomeCompleto(dados.nome_completo || dados.apelido || 'Utilizador');
        setTelefone(dados.telefone || '');
        setEmail(dados.email || emailUsuario);
        
        if (dados.foto_perfil) {
          setFotoPerfil(`http://localhost:8000${dados.foto_perfil}`);
        }

      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      }
    }
    carregarPerfil();
  }, [emailUsuario]);

  const handleSalvar = async () => {
    if (novaSenha && novaSenha !== confirmarSenha) {
      alert("A nova senha e a confirmação não coincidem!");
      return;
    }

    try {
      const payload = {
        apelido: apelido,
        email: email,
        telefone: telefone || null,
        senha_atual: senhaAtual || null,
        nova_senha: novaSenha || null
      };

      await axios.put(`http://localhost:8000/perfil/atualizar/${emailUsuario}`, payload);
      alert("Perfil atualizado com sucesso!");
      setNomeCompleto(apelido); 
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      
    } catch (error) {
      alert("Erro ao atualizar: " + (error.response?.data?.detail || "Verifique as suas informações."));
    }
  };

  const handleEditarFotoClick = () => {
    fileInputRef.current.click(); 
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setFotoPerfil(imageUrl);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`http://localhost:8000/perfil/${emailUsuario}/foto`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setFotoPerfil(`http://localhost:8000${response.data.foto_url}`);
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error);
      alert("Erro ao guardar a foto de perfil no servidor.");
    }
  };

  const gerarIniciais = (nome) => {
    if (!nome) return "US";
    const partes = nome.trim().split(" ");
    if (partes.length > 1) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  const iniciais = gerarIniciais(nomeCompleto);

  return (
    <div className="perfil-page">
      <header className="perfil-header">
        <div className="header-left">
          <button className="icon-button" onClick={onVoltar} aria-label="Voltar">
            <ArrowLeftIcon />
          </button>
          <div className="header-titles">
            <h1 className="header-title">Editar Perfil</h1>
            <p className="header-subtitle">Atualize suas informações</p>
          </div>
        </div>
        <div className="header-right">
          <button className="icon-button bell-button" aria-label="Notificações">
            <BellIcon />
          </button>
          <div className="avatar-small">
            {fotoPerfil ? (
              <img src={fotoPerfil} alt="Minha Foto" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              iniciais
            )}
          </div>
        </div>
      </header>

      <main className="perfil-main">
        <div className="perfil-card user-info-card">
          <div className="avatar-large-container">
            <div className="avatar-large">
              {fotoPerfil ? (
                <img src={fotoPerfil} alt="Minha Foto" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                iniciais
              )}
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange} 
            />
            
            <button className="edit-avatar-btn" aria-label="Editar foto" onClick={handleEditarFotoClick}>
              <PencilIcon />
            </button>
          </div>
          <div className="user-details">
            <h2 className="user-name">{nomeCompleto}</h2>
            <p className="user-email">{email}</p>
            <span className="user-badge">★ Membro da Trilha</span>
          </div>
        </div>

        {/* Informações Pessoais */}
        <div className="perfil-card">
          <h3 className="section-title">
            <UserIcon /> Informações pessoais
          </h3>
          <div className="form-row">
            <div className="field flex-1">
              <label className="field-label">Apelido</label>
              <div className="field-input">
                <UserIcon />
                <input
                  type="text"
                  value={apelido}
                  onChange={(e) => setApelido(e.target.value)}
                  placeholder="Escolha um apelido"
                />
              </div>
            </div>
            <div className="field flex-1">
              <label className="field-label">
                Telefone <span className="optional-text">(opcional)</span>
              </label>
              <div className="field-input">
                <PhoneIcon />
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(88) 99430-0146"
                />
              </div>
            </div>
          </div>
          <div className="field">
            <label className="field-label">E-mail</label>
            <div className="field-input">
              <MailIcon />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Segurança */}
        <div className="perfil-card">
          <h3 className="section-title">
            <LockIcon /> Segurança
          </h3>
          <div className="form-row">
            <div className="field flex-1">
              <label className="field-label">Senha atual</label>
              <div className="field-input">
                <input
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Digite sua senha atual"
                />
              </div>
            </div>
            <div className="field flex-1">
              <label className="field-label">Nova senha</label>
              <div className="field-input">
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Digite sua nova senha"
                />
              </div>
            </div>
          </div>
          <div className="field">
            <label className="field-label">Confirmar nova senha</label>
            <div className="field-input">
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Confirme sua nova senha"
              />
            </div>
          </div>
        </div>

        {/* Preferências */}
        <div className="perfil-card">
          <h3 className="section-title preferences-title">Preferências</h3>
          <div className="preferences-row">
            <div className="preferences-text">
              <h4 className="pref-title">Receber notificações do aplicativo</h4>
              <p className="pref-desc">Fique por dentro de novidades e atualizações</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificacoes}
                onChange={(e) => setNotificacoes(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
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
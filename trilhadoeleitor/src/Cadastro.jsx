import axios from 'axios';
import { useState } from 'react';
import logo from './assets/TDElogo.png';
import { UserIcon, MailIcon, LockIcon } from './Icons';

export default function Cadastro({ onSwitch }) {
  const [apelido, setApelido] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `http://localhost:8000/cadastro?apelido=${apelido}&email=${email}&password=${senha}`
      );
      alert("Cadastrado com sucesso!");
      onSwitch();
    } catch (error) {
      alert("Erro: " + (error.response?.data?.detail || "Verifique os campos"));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-banner" />
      <main className="auth-main">
        <div className="auth-logo">
          <img src={logo} alt="Trilha do Eleitor" />
        </div>
        <h1 className="auth-title">Trilha do Eleitor</h1>
        <h2 className="auth-subtitle">Crie sua conta</h2>
        <p className="auth-desc">Preencha os dados abaixo e inicie sua jornada!</p>

        <div className="auth-card">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="field-label">Apelido</label>
              <div className="field-input">
                <UserIcon />
                <input
                  type="text"
                  value={apelido}
                  onChange={(e) => setApelido(e.target.value)}
                  placeholder="Escolha um apelido"
                  required
                />
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
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Senha</label>
              <div className="field-input">
                <LockIcon />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary">Criar conta</button>
          </form>
        </div>

        <p className="auth-switch">
          Já tem uma conta?{' '}
          <button onClick={onSwitch}>Fazer Login</button>
        </p>
      </main>
    </div>
  );
}

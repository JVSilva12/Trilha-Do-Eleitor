import axios from 'axios';
import { useState } from 'react';
import logo from './assets/TDElogo.png';
import { MailIcon, LockIcon } from './Icons';

export default function Login({ onSwitch, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `http://localhost:8000/login?email=${email}&password=${senha}`
      );
      
      // alert("Login realizado!");
      
      if (onLoginSuccess) {
        onLoginSuccess(email);
      }
    } catch (error) {
      alert("Erro: " + (error.response?.data?.detail || "Credenciais inválidas"));
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
        <h2 className="auth-subtitle">Entre na sua conta</h2>
        <p className="auth-desc">Acesse para continuar sua jornada cidadã.</p>

        <div className="auth-card">
          <form onSubmit={handleSubmit}>
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

            <button type="submit" className="btn-primary">Entrar</button>
          </form>
        </div>

        <p className="auth-switch">
          Não tem uma conta?{' '}
          <button onClick={onSwitch}>Cadastre-se</button>
        </p>
      </main>
    </div>
  );
}
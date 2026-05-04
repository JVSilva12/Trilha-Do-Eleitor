import { useState } from 'react';
import axios from 'axios';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensagem, setMensagem] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); // Impede a página de recarregar
    try {
      // Faz a chamada para o backend FastAPI
      const response = await axios.post(`http://localhost:8000/login?email=${email}&password=${password}`);
      
      setMensagem("Login realizado com sucesso!");
      console.log("Token recebido:", response.data.token);
      
      // Aqui posso salvar o token no localStorage:
      // localStorage.setItem('token', response.data.token);

    } catch (error) {
      setMensagem("Erro ao fazer login: " + (error.response?.data?.detail || "Erro no servidor"));
    }
  };

  return (
    <div style={{ maxWidth: '300px', margin: '50px auto', textAlign: 'center' }}>
      <h2>Entrar no Trilhado Eleitor</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '8px', width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '8px', width: '100%' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Entrar
        </button>
      </form>
      {mensagem && <p style={{ marginTop: '15px', color: 'blue' }}>{mensagem}</p>}
    </div>
  );
}

export default Login;
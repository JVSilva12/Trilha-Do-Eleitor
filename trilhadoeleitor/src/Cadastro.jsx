import { useState } from 'react';
import axios from 'axios';

function Cadastro() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensagem, setMensagem] = useState('');

  const handleCadastro = async (e) => {
    e.preventDefault();
    try {
      // Envia os dados para a rota de cadastro do FastAPI
      const response = await axios.post(`http://localhost:8000/cadastro?email=${email}&password=${password}`);
      
      setMensagem(response.data.message);
      setEmail('');
      setPassword('');
    } catch (error) {
      setMensagem("Erro no cadastro: " + (error.response?.data?.detail || "Erro no servidor"));
    }
  };

  return (
    <div style={{ maxWidth: '300px', margin: '20px auto', textAlign: 'center', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
      <h2>Criar Conta</h2>
      <form onSubmit={handleCadastro}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Escolha um e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '8px', width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            placeholder="Crie uma senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '8px', width: '100%' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
          Cadastrar
        </button>
      </form>
      {mensagem && <p style={{ marginTop: '15px' }}>{mensagem}</p>}
    </div>
  );
}

export default Cadastro;

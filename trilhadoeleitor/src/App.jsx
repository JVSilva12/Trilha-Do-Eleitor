import { useState } from 'react';
import './App.css';
import Login from './Login';
import Cadastro from './Cadastro';
import Trilhas from './Trilhas';
import EditarPerfil from './EditarPerfil';

function App() {
  const [tela, setTela] = useState('login');
  const [emailLogado, setEmailLogado] = useState('');

  const handleLoginSucesso = (email) => {
    setEmailLogado(email);
    setTela('home');
  };

  const handleLogout = () => {
    setEmailLogado('');
    setTela('login');
  };

  return (
    <div className="App">
      {/* Fluxo de Login */}
      {tela === 'login' && (
        <Login 
          onLoginSucesso={handleLoginSucesso} 
          onSwitch={() => setTela('cadastro')} 
        />
      )}
      
      {/* Fluxo de Cadastro */}
      {tela === 'cadastro' && (
        <Cadastro 
          onSwitch={() => setTela('login')} 
        />
      )}

      {/* Home Page - Exibe as Trilhas e o cabeçalho com foto */}
      {tela === 'home' && (
        <Trilhas 
          emailUsuario={emailLogado} 
          onLogout={handleLogout} 
          onIrParaPerfil={() => setTela('perfil')} 
        />
      )}

      {/* Página de Edição de Perfil */}
      {tela === 'perfil' && (
        <EditarPerfil 
          emailUsuario={emailLogado} 
          onVoltar={() => setTela('home')} 
        />
      )}
    </div>
  );
}

export default App;
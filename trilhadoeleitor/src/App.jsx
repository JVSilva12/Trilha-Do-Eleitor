import { useState } from 'react';
import './App.css';
import Login from './Login';
import Cadastro from './Cadastro';
import Trilhas from './Trilhas';
import EditarPerfil from './EditarPerfil';
import PainelConteudista from './PainelConteudista';

function App() {
  // Estados para controlar qual tela exibir e quem está logado (padrão minúsculo)
  const [tela, setTela] = useState('login'); // Opções: 'login', 'cadastro', 'home', 'perfil', 'painel'
  const [emailLogado, setEmailLogado] = useState('');

  // Função chamada pelo componente Login quando o acesso é permitido
  const handleLoginSucesso = (email) => {
    setEmailLogado(email);
    setTela('home');
  };

  // Função para limpar os dados e voltar para a tela inicial
  const handleLogout = () => {
    setEmailLogado('');
    setTela('login');
  };

  return (
    <div className="App">
      {/* CORREÇÃO: Alterado de 'Login' para 'login' (minúsculo) para bater com o useState */}
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
          onIrParaPainel={() => setTela('painel')} 
        />
      )}

      {/* Página de Edição de Perfil */}
      {tela === 'perfil' && (
        <EditarPerfil 
          emailUsuario={emailLogado} 
          onVoltar={() => setTela('home')} 
        />
      )}

      {/* Painel Administrativo do Conteudista */}
      {tela === 'painel' && (
        <PainelConteudista 
          onVoltar={() => setTela('home')} 
        />
      )}
    </div>
  );
}

export default App;
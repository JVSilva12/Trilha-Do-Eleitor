import { useState } from 'react';
import './App.css';
import Login from './Login';
import Cadastro from './Cadastro';
import Trilhas from './Trilhas';
import EditarPerfil from './EditarPerfil';
import GerenciarTrilhas from './pages/conteudista/GerenciarTrilhas.jsx';
import NovaTrilha from './pages/conteudista/NovaTrilha.jsx';
import PainelConteudista from './PainelConteudista';
import VisualizarTeoria from './VisualizarTeoria';
import VisualizarQuiz from './VisualizarQuiz';

function App() {
  // Controle de estado centralizado para segurança e navegação direta
  const [tela, setTela] = useState('login'); // 'login', 'cadastro', 'home', 'perfil', 'gerenciar-trilhas', 'nova-trilha', 'painel', 'ver-teoria', 'ver-quiz'
  const [emailLogado, setEmailLogado] = useState('');
  const [trilhaIdEdicao, setTrilhaIdEdicao] = useState(null);
  const [trilhaVisualizacao, setTrilhaVisualizacao] = useState({ id: null, nome: '' });

  const handleLoginSucesso = (email) => {
    setEmailLogado(email);
    setTela('home');
  };

  const handleLogout = () => {
    setEmailLogado('');
    setTela('login');
  };

  const handleAbrirEdicao = (id) => {
    setTrilhaIdEdicao(id);
    setTela('painel');
  };

  const handleAbrirTeoriaAluno = (id, nome) => {
    setTrilhaVisualizacao({ id, nome });
    setTela('ver-teoria');
  };

  const handleAbrirQuizAluno = (id, nome) => {
    setTrilhaVisualizacao({ id, nome });
    setTela('ver-quiz');
  };

  return (
    <div className="App">
      {/* Fluxo de Autenticação */}
      {tela === 'login' && (
        <Login onLoginSucesso={handleLoginSucesso} onSwitch={() => setTela('cadastro')} />
      )}
      
      {tela === 'cadastro' && (
        <Cadastro onSwitch={() => setTela('login')} />
      )}

      {/* Home Page Principal do Aluno */}
      {tela === 'home' && (
        <Trilhas 
          emailUsuario={emailLogado} 
          onLogout={handleLogout} 
          onIrParaPerfil={() => setTela('perfil')} 
          onIrParaPainel={() => setTela('gerenciar-trilhas')} 
          onVisualizarTeoria={handleAbrirTeoriaAluno}
          onVisualizarQuiz={handleAbrirQuizAluno}
        />
      )}

      {/* Edição de Dados Cadastrais do Usuário */}
      {tela === 'perfil' && (
        <EditarPerfil emailUsuario={emailLogado} onVoltar={() => setTela('home')} />
      )}

      {/* Repositório de Gerenciamento do Conteudista */}
      {tela === 'gerenciar-trilhas' && (
        <GerenciarTrilhas 
          emailUsuario={emailLogado} 
          onVoltar={() => setTela('home')} 
          onIrParaNovaTrilha={() => setTela('nova-trilha')} 
          onEditarTrilha={handleAbrirEdicao} 
        />
      )}

      {/* Formulário de Estrutura Inicial de Trilha */}
      {tela === 'nova-trilha' && (
        <NovaTrilha onVoltar={() => setTela('gerenciar-trilhas')} />
      )}

      {/* Painel de Incrementação de Conteúdo (Lápis) */}
      {tela === 'painel' && (
        <PainelConteudista trilhaId={trilhaIdEdicao} onVoltar={() => setTela('gerenciar-trilhas')} />
      )}

      {/* Visualização de Aula Teórica Real para o Aluno */}
      {tela === 'ver-teoria' && (
        <VisualizarTeoria 
          trilhaId={trilhaVisualizacao.id} 
          trilhaNome={trilhaVisualizacao.nome} 
          onVoltar={() => setTela('home')} 
        />
      )}

      {/* Interface Interativa de Exercícios e Simulados do Aluno */}
      {tela === 'ver-quiz' && (
        <VisualizarQuiz
          trilhaId={trilhaVisualizacao.id}
          trilhaNome={trilhaVisualizacao.nome}
          onVoltar={() => setTela('home')}
        />
      )}
    </div>
  );
}

export default App;
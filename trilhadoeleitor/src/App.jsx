import { useState, useEffect, useRef } from 'react';
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
import musicaFundo from './assets/MorningRoutine.mp3';
import somClique from './assets/clique.mp3';

function App() {
  // Controle de estado centralizado para segurança e navegação direta
  const [tela, setTela] = useState('login'); // 'login', 'cadastro', 'home', 'perfil', 'gerenciar-trilhas', 'nova-trilha', 'painel', 'ver-teoria', 'ver-quiz'
  const [emailLogado, setEmailLogado] = useState('');
  const [trilhaIdEdicao, setTrilhaIdEdicao] = useState(null);
  const [trilhaVisualizacao, setTrilhaVisualizacao] = useState({ id: null, nome: '' });

  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = true;
    audio.volume = 0.5;

    audio.play().catch(() => {
      const iniciarNoClique = () => {
        audio.play().catch(() => {});
        document.removeEventListener('click', iniciarNoClique);
      };
      document.addEventListener('click', iniciarNoClique);
    });

    return () => {
      document.removeEventListener('click', () => {});
    };
  }, []);

  const navegarPara = (novaTela) => {
    const clique = new Audio(somClique);
    clique.volume = 0.20;
    clique.play().catch(() => {});
    setTela(novaTela);
  };

  const handleLoginSucesso = (email) => {
    setEmailLogado(email);
    navegarPara('home');
  };

  const handleLogout = () => {
    setEmailLogado('');
    navegarPara('login');
  };

  const handleAbrirEdicao = (id) => {
    setTrilhaIdEdicao(id);
    navegarPara('painel');
  };

  const handleAbrirTeoriaAluno = (id, nome) => {
    setTrilhaVisualizacao({ id, nome });
    navegarPara('ver-teoria');
  };

  const handleAbrirQuizAluno = (id, nome) => {
    setTrilhaVisualizacao({ id, nome });
    navegarPara('ver-quiz');
  };

  return (
    <div className="App">

      {/* Elemento de áudio oculto — gerenciado pelo useRef acima */}
      <audio ref={audioRef} src={musicaFundo} preload="auto" style={{ display: 'none' }} />

      {/* Fluxo de Autenticação */}
      {tela === 'login' && (
        <Login onLoginSucesso={handleLoginSucesso} onSwitch={() => navegarPara('cadastro')} />
      )}

      {tela === 'cadastro' && (
        <Cadastro onSwitch={() => navegarPara('login')} />
      )}

      {/* Home Page Principal do Aluno e Eleitor */}
      {tela === 'home' && (
        <Trilhas
          emailUsuario={emailLogado}
          onLogout={handleLogout}
          onIrParaPerfil={() => navegarPara('perfil')}
          onIrParaPainel={() => navegarPara('gerenciar-trilhas')}
          onVisualizarTeoria={handleAbrirTeoriaAluno}
          onVisualizarQuiz={handleAbrirQuizAluno}
        />
      )}

      {/* Edição de Dados Cadastrais do Usuário */}
      {tela === 'perfil' && (
        <EditarPerfil emailUsuario={emailLogado} onVoltar={() => navegarPara('home')} />
      )}

      {/* Repositório de Gerenciamento Geral do Conteudista */}
      {tela === 'gerenciar-trilhas' && (
        <GerenciarTrilhas
          emailUsuario={emailLogado}
          onVoltar={() => navegarPara('home')}
          onIrParaNovaTrilha={() => navegarPara('nova-trilha')}
          onEditarTrilha={handleAbrirEdicao}
        />
      )}

      {/* Formulário de Estrutura Inicial de Novas Trilhas */}
      {tela === 'nova-trilha' && (
        <NovaTrilha onVoltar={() => navegarPara('gerenciar-trilhas')} />
      )}

      {/* Painel de Incrementação de Conteúdo do Conteudista (Lápis) */}
      {tela === 'painel' && (
        <PainelConteudista trilhaId={trilhaIdEdicao} onVoltar={() => navegarPara('gerenciar-trilhas')} />
      )}

      {/* Visualização de Aula Teórica Dinâmica com Trava de Progresso
          audioRef é passado para que VisualizarTeoria pause/retome a música
          conforme o usuário interage com os vídeos embutidos. */}
      {tela === 'ver-teoria' && (
        <VisualizarTeoria
          trilhaId={trilhaVisualizacao.id}
          trilhaNome={trilhaVisualizacao.nome}
          emailUsuario={emailLogado}
          audioFundo={audioRef}
          onVoltar={() => navegarPara('home')}
        />
      )}

      {/* Interface Interativa de Exercícios e Simulados do Aluno */}
      {tela === 'ver-quiz' && (
        <VisualizarQuiz
          trilhaId={trilhaVisualizacao.id}
          trilhaNome={trilhaVisualizacao.nome}
          onVoltar={() => navegarPara('home')}
        />
      )}
    </div>
  );
}

export default App;
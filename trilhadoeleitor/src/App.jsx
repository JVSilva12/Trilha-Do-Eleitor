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
import VisualizarPratica from './VisualizarPratica';
import SimuladorUrna from './SimuladorUrna';
import AtividadeEleicoes from './AtividadeEleicoes';
import musicaFundo from './assets/MorningRoutine.mp3';
import somClique from './assets/clique.mp3';

function App() {
  const [tela, setTela] = useState('login');
  const [emailLogado, setEmailLogado] = useState('');
  const [trilhaIdEdicao, setTrilhaIdEdicao] = useState(null);
  const [trilhaVisualizacao, setTrilhaVisualizacao] = useState({ id: null, nome: '' });

  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = true;
    audio.volume = 0.25;

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
    clique.volume = 0.25;
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

  const handleAbrirPraticaAluno = (id, nome) => {
    setTrilhaVisualizacao({ id, nome });
    navegarPara('ver-pratica');
  };

  return (
    <div className="App">

      {/* Elemento de áudio oculto — gerenciado pelo useRef acima */}
      <audio ref={audioRef} src={musicaFundo} preload="auto" style={{ display: 'none' }} />

      {tela === 'login' && (
        <Login onLoginSucesso={handleLoginSucesso} onSwitch={() => navegarPara('cadastro')} />
      )}

      {tela === 'cadastro' && (
        <Cadastro onSwitch={() => navegarPara('login')} />
      )}

      {tela === 'home' && (
        <Trilhas 
          emailUsuario={emailLogado} 
          onLogout={handleLogout} 
          onIrParaPerfil={() => navegarPara('perfil')} 
          onIrParaPainel={() => navegarPara('gerenciar-trilhas')} 
          onVisualizarTeoria={handleAbrirTeoriaAluno}
          onVisualizarQuiz={handleAbrirQuizAluno}
          onVisualizarPratica={handleAbrirPraticaAluno}
        />
      )}

      {tela === 'perfil' && (
        <EditarPerfil emailUsuario={emailLogado} onVoltar={() => navegarPara('home')} />
      )}

      {tela === 'gerenciar-trilhas' && (
        <GerenciarTrilhas 
          emailUsuario={emailLogado} 
          onVoltar={() => navegarPara('home')} 
          onIrParaNovaTrilha={() => navegarPara('nova-trilha')} 
          onEditarTrilha={handleAbrirEdicao} 
        />
      )}

      {tela === 'nova-trilha' && (
        <NovaTrilha onVoltar={() => navegarPara('gerenciar-trilhas')} />
      )}

      {tela === 'painel' && (
        <PainelConteudista trilhaId={trilhaIdEdicao} onVoltar={() => navegarPara('gerenciar-trilhas')} />
      )}

      {tela === 'ver-teoria' && (
        <VisualizarTeoria 
          trilhaId={trilhaVisualizacao.id} 
          trilhaNome={trilhaVisualizacao.nome} 
          emailUsuario={emailLogado}
          audioFundo={audioRef}
          onVoltar={() => navegarPara('home')} 
        />
      )}

      {tela === 'ver-quiz' && (
        <VisualizarQuiz
          trilhaId={trilhaVisualizacao.id}
          trilhaNome={trilhaVisualizacao.nome}
          onVoltar={() => navegarPara('home')}
        />
      )}

      {/* Prática — renderiza componente específico por trilha */}
      {tela === 'ver-pratica' && (
        <>
          {trilhaVisualizacao.id === 3 ? (
            <VisualizarPratica 
              trilhaId={trilhaVisualizacao.id}
              trilhaNome={trilhaVisualizacao.nome}
              emailUsuario={emailLogado}
              audioFundo={audioRef}
              onVoltar={() => navegarPara('home')}
            />
          ) : (
            <SimuladorUrna
              onVoltar={() => navegarPara('home')}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
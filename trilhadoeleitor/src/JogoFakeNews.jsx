import { useState, useRef } from 'react';
import imagemFake from './assets/Fake.png';
import imagemFake2 from './assets/Fake (2).png';
import imagemFake3 from './assets/Fake (3).png';
import imagemFake4 from './assets/Fake (4).png';
import imagemFake5 from './assets/Fake (5).png';
import imagemVerdade from './assets/Verdade.png';
import imagemVerdade2 from './assets/Verdade (2).png';
import imagemVerdade3 from './assets/Verdade (3).png';
import imagemVerdade4 from './assets/Verdade (4).png';
import imagemFakeNewsPadrao from './assets/Noticia2.png';
import './JogoFakeNews.css';

// ========================================================================
// DADOS DAS NOTÍCIAS - 9 IMAGENS (5 FAKES + 4 VERDADES)
// ========================================================================
// Ordem será sempre aleatória
const noticiasBase = [
  {
    id: 1,
    title: 'Fake News 1',
    image: imagemFake,
    isFact: false,
    explanation: 'Esta é uma FAKE NEWS. As informações foram manipuladas e desmentidas por agências de checagem de fatos.'
  },
  {
    id: 2,
    title: 'Fake News 2',
    image: imagemFake2,
    isFact: false,
    explanation: 'Esta é uma FAKE NEWS. Desinformação comum que circula em redes sociais sobre eleições.'
  },
  {
    id: 3,
    title: 'Fake News 3',
    image: imagemFake3,
    isFact: false,
    explanation: 'Esta é uma FAKE NEWS. Imagem manipulada e contexto alterado propositalmente.'
  },
  {
    id: 4,
    title: 'Fake News 4',
    image: imagemFake4,
    isFact: false,
    explanation: 'Esta é uma FAKE NEWS. Conteúdo falso que visa enganar eleitores.'
  },
  {
    id: 5,
    title: 'Fake News 5',
    image: imagemFake5,
    isFact: false,
    explanation: 'Esta é uma FAKE NEWS. Informação verificada como falsa por múltiplos fact-checkers.'
  },
  {
    id: 6,
    title: 'Verdade 1',
    image: imagemVerdade,
    isFact: true,
    explanation: 'Esta é uma VERDADE. Informação verificada e confirmada por fontes oficiais confiáveis.'
  },
  {
    id: 7,
    title: 'Verdade 2',
    image: imagemVerdade2,
    isFact: true,
    explanation: 'Esta é uma VERDADE. Fato confirmado sobre o processo eleitoral brasileiro.'
  },
  {
    id: 8,
    title: 'Verdade 3',
    image: imagemVerdade3,
    isFact: true,
    explanation: 'Esta é uma VERDADE. Informação comprovada e documentada oficialmente.'
  },
  {
    id: 9,
    title: 'Verdade 4',
    image: imagemVerdade4,
    isFact: true,
    explanation: 'Esta é uma VERDADE. Dado verificado por especialistas e instituições reconhecidas.'
  }
];

// Função para embaralhar array
const embaralhar = (array) => {
  const novo = [...array];
  for (let i = novo.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [novo[i], novo[j]] = [novo[j], novo[i]];
  }
  return novo;
};

// Embaralha as notícias sempre que o jogo inicia
const mockNewsData = embaralhar(noticiasBase);

const JogoFakeNews = ({ newsData = null, onGameComplete = null, titulo = "Detetive da Informação", descricao = "Teste suas habilidades: arraste a notícia e descubra se é verdadeira ou falsa." }) => {
  const gameData = Array.isArray(newsData) && newsData.length > 0 ? newsData : mockNewsData;
  
  // LÓGICA CORRIGIDA AQUI
  const resolvedGameData = gameData.map((item) => {
    let image = item.image;

    // 1. Se for um array de imagens, pega a primeira
    if (Array.isArray(image) && image.length > 0) {
      image = image[0];
    }

    // 2. Se for um objeto de imagem (comum no Next.js ou APIs com { src: '...' }), extrai o src
    if (image && typeof image === 'object' && image.src) {
      image = image.src;
    }

    // Extrai o src do fallback padrão caso ele também seja importado como objeto
    const defaultFallback = typeof imagemFakeNewsPadrao === 'object' && imagemFakeNewsPadrao.src 
      ? imagemFakeNewsPadrao.src 
      : imagemFakeNewsPadrao;

    // 3. Fallback final: se não houver imagem ou a string for vazia, usa o padrão
    if (!image || (typeof image === 'string' && image.trim() === '')) {
      image = defaultFallback;
    }

    return {
      ...item,
      image
    };
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [startX, setStartX] = useState(0);

  const currentNews = resolvedGameData[currentIndex];
  const cardRef = useRef(null);

  if (!currentNews) {
    console.log("Caminho da imagem atual sendo lida:", currentNews.image);

    return (
      <div className="game-wrapper">
        <div className="game-container">
          <header className="game-header">
            <h1>{titulo}</h1>
            <p>{descricao}</p>
          </header>
          <div className="game-empty-state">
            Nenhuma notícia foi carregada para este jogo.
          </div>
        </div>
      </div>
    );
  }

  // Lógica de início do arrasto (Mouse e Touch)
  const handleDragStart = (clientX) => {
    if (hasAnswered) return;
    setIsDragging(true);
    setStartX(clientX - dragX);
  };

  // Lógica de movimento do arrasto
  const handleDragMove = (clientX) => {
    if (!isDragging || hasAnswered) return;
    const currentDrag = clientX - startX;
    setDragX(currentDrag);
  };

  // Lógica de finalização do arrasto
  const handleDragEnd = () => {
    if (!isDragging || hasAnswered) return;
    setIsDragging(false);

    const threshold = 100; // Distância mínima para validar a resposta
    if (dragX > threshold || dragX < -threshold) {
      setHasAnswered(true);
      setDragX(0); // Centraliza o card para mostrar o resultado
    } else {
      setDragX(0); // Volta ao centro se não arrastou o suficiente
    }
  };

  const handleNext = () => {
    if (currentIndex < gameData.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setHasAnswered(false);
    } else {
      if (onGameComplete) {
        onGameComplete();
      } else {
        alert("Fim do Jogo!");
      }
    }
  };

  // Define a classe de resultado baseada na veracidade da notícia (após responder)
  const getResultClass = () => {
    if (!hasAnswered) return '';
    return currentNews.isFact ? 'result-fact' : 'result-fake';
  };

  // Define o fallback seguro para o onError da imagem
  const safeFallbackImg = typeof imagemFakeNewsPadrao === 'object' && imagemFakeNewsPadrao.src 
    ? imagemFakeNewsPadrao.src 
    : imagemFake;

  return (
    <div className="game-wrapper">
      <div className="game-container">
        
        <header className="game-header">
          <h1>{titulo}</h1>
          <p>{descricao}</p>
        </header>

        <main className="game-main">
          <div className="news-counter">
            Notícia {currentIndex + 1} de {gameData.length}
          </div>
          
          <div className="drag-indicators">
            <span className="indicator-fake">Arraste se for FAKE</span>
            <span className="indicator-fact">Arraste se for FATO</span>
          </div>

          <div 
            className={`news-card ${getResultClass()}`}
            ref={cardRef}
            onMouseDown={(e) => handleDragStart(e.clientX)}
            onMouseMove={(e) => handleDragMove(e.clientX)}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
            onTouchEnd={handleDragEnd}
            style={{ 
              transform: hasAnswered ? 'none' : `translateX(${dragX}px) rotate(${dragX * 0.05}deg)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out'
            }}
          >
            {/* O overlay colorido só aparece quando hasAnswered é true, controlado pelo CSS */}
            <div className="card-overlay"></div>
            
            <div className="image-placeholder">
              <div className="news-card-label">{currentNews.title || `Notícia ${currentIndex + 1}`}</div>
              <img
                src={currentNews.image}
                alt="Notícia"
                draggable="false"
                onError={(e) => {
                  // CORREÇÃO: Usa o fallback de forma segura e evita loop infinito
                  if (e.currentTarget.src !== safeFallbackImg && !e.currentTarget.src.includes(safeFallbackImg)) {
                    e.currentTarget.src = safeFallbackImg;
                  }
                }}
              />
            </div>
          </div>

          {hasAnswered && (
            <div className="feedback-section">
              <div className={`explanation-box ${getResultClass()}`}>
                <p>{currentNews.explanation}</p>
              </div>
              <button className="btn-next" onClick={handleNext}>
                {currentIndex < gameData.length - 1 ? 'Próxima Notícia' : 'Concluir Jogo'}
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default JogoFakeNews;
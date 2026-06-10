import { useState, useRef } from 'react';
import imagemNoticia1 from './assets/Noticia1.png';
import imagemFakeNewsPadrao from './assets/Noticia2.png';
import imagemFake from './assets/fakenews.png';
import './JogoFakeNews.css';

// Dados simulados para o jogo
const mockNewsData = [
  {
    id: 1,
    title: 'Notícia 1',
    image: imagemNoticia1,
    isFact: true,
    explanation: 'Esta notícia é um FATO. Os dados foram confirmados por fontes oficiais de saúde.'
  },
  {
    id: 2,
    title: 'Notícia 2',
    image: imagemFakeNewsPadrao,
    isFact: false,
    explanation: 'Esta notícia é FAKE. A imagem foi manipulada e a informação desmentida por agências de checagem.'
  },
  {
    id: 3,
    title: 'Notícia 3',
    image: imagemFake,
    isFact: false,
    explanation: 'Exemplo adicional usando a imagem padrão.'
  }
];

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
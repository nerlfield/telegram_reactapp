import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInterval } from './hooks/useInterval';
import { Trophy, Heart } from 'lucide-react';
import { useTelegramWebApp } from './hooks/useTelegramWebApp';

type Position = {
  x: number;
  y: number;
};

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREASE = 5;

function App() {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [isPaused, setIsPaused] = useState(false);
  const webApp = useTelegramWebApp();
  const [cellSize, setCellSize] = useState(20);
  const containerRef = useRef<HTMLDivElement>(null);

  // Add new state for touch handling
  const [touchStart, setTouchStart] = useState<Position | null>(null);
  
  // Load high score on component mount
  useEffect(() => {
    const loadHighScore = async () => {
      if (!webApp?.initDataUnsafe?.user?.id) return;
      
      try {
        const response = await fetch(`/api/scores/${webApp.initDataUnsafe.user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch high score');
        }
        const data = await response.json();
        setHighScore(data.highest_score);
      } catch (error) {
        console.error('Error loading high score:', error);
      }
    };

    loadHighScore();
  }, [webApp?.initDataUnsafe?.user?.id]);

  // Add touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // Require minimum swipe distance to trigger direction change (20px)
    const minSwipeDistance = 20;
    
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
      return;
    }

    // Determine swipe direction based on the largest delta
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0 && direction !== 'LEFT') {
        setDirection('RIGHT');
      } else if (deltaX < 0 && direction !== 'RIGHT') {
        setDirection('LEFT');
      }
    } else {
      // Vertical swipe
      if (deltaY > 0 && direction !== 'UP') {
        setDirection('DOWN');
      } else if (deltaY < 0 && direction !== 'DOWN') {
        setDirection('UP');
      }
    }
    
    // Reset touch start to prevent multiple triggers
    setTouchStart(null);
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  const calculateCellSize = useCallback(() => {
    if (!containerRef.current) return 20;
    
    // Get the container's width accounting for padding
    const containerWidth = containerRef.current.clientWidth - 32; // 32px for p-4 padding (16px each side)
    return Math.floor(containerWidth / GRID_SIZE);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setCellSize(calculateCellSize());
    };

    // Create a ResizeObserver to watch the container size
    const resizeObserver = new ResizeObserver(handleResize);
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Initial calculation
    handleResize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [calculateCellSize]);

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood());
    setDirection('RIGHT');
    setIsGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setIsPaused(false);
  };

  const checkCollision = (head: Position) => {
    if (
      head.x < 0 ||
      head.x >= GRID_SIZE ||
      head.y < 0 ||
      head.y >= GRID_SIZE
    ) {
      return true;
    }

    for (const segment of snake.slice(1)) {
      if (head.x === segment.x && head.y === segment.y) {
        return true;
      }
    }

    return false;
  };

  const moveSnake = () => {
    if (isGameOver || isPaused) return;

    const head = { ...snake[0] };

    switch (direction) {
      case 'UP':
        head.y -= 1;
        break;
      case 'DOWN':
        head.y += 1;
        break;
      case 'LEFT':
        head.x -= 1;
        break;
      case 'RIGHT':
        head.x += 1;
        break;
    }

    if (checkCollision(head)) {
      setIsGameOver(true);
      if (score > highScore) {
        setHighScore(score);
      }
      return;
    }

    const newSnake = [head, ...snake];

    if (head.x === food.x && head.y === food.y) {
      setFood(generateFood());
      setScore(prev => prev + 10);
      setSpeed(prev => Math.max(prev - SPEED_INCREASE, 50));
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  };

  useInterval(moveSnake, speed);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
        case ' ':
          setIsPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction]);

  const submitScore = async (finalScore: number) => {
    if (!webApp?.initDataUnsafe?.user?.id) return;

    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user_id: webApp.initDataUnsafe.user.id,
          score: finalScore 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit score');
      }

      const data = await response.json();
      setHighScore(data.highest_score);
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  useEffect(() => {
    if (isGameOver) {
      submitScore(score);
      if (webApp?.MainButton) {
        webApp.MainButton.text = 'Play Again';
        webApp.MainButton.show();
        webApp.MainButton.onClick(resetGame);
      }
    } else {
      webApp?.MainButton?.hide();
    }
  }, [isGameOver, score, webApp]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-[400px] px-4">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_1px,_#000_1px)] bg-[length:24px_24px] opacity-30" />
        
        <div 
          ref={containerRef}
          className="relative bg-black border border-white/10 p-4 sm:p-8 rounded-3xl shadow-[0_0_50px_-12px] shadow-white/20"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="text-white" size={20} />
              <span className="text-white font-mono">High Score: {highScore}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="text-white" size={20} />
              <span className="text-white font-mono">Score: {score}</span>
            </div>
          </div>
          
          <div 
            className="relative border border-white/20 rounded-lg overflow-hidden bg-black"
            style={{
              width: GRID_SIZE * cellSize,
              height: GRID_SIZE * cellSize,
            }}
          >
            {/* Grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,_#ffffff05_1px,_transparent_1px),_linear-gradient(to_bottom,_#ffffff05_1px,_transparent_1px)] bg-[size:20px_20px]" />
            
            {snake.map((segment, index) => (
              <div
                key={index}
                className={`absolute transition-all duration-75 ${
                  index === 0 
                    ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]' 
                    : 'bg-white/80'
                }`}
                style={{
                  width: cellSize - 2,
                  height: cellSize - 2,
                  left: segment.x * cellSize,
                  top: segment.y * cellSize,
                }}
              />
            ))}
            <div
              className="absolute bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] animate-[pulse_2s_ease-in-out_infinite]"
              style={{
                width: cellSize - 2,
                height: cellSize - 2,
                left: food.x * cellSize,
                top: food.y * cellSize,
              }}
            />
          </div>

          {(isGameOver || isPaused) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4 font-mono">
                  {isGameOver ? 'GAME OVER' : 'PAUSED'}
                </h2>
                {isGameOver && (
                  <p className="text-white mb-4 font-mono">Final Score: {score}</p>
                )}
                <button
                  onClick={isGameOver ? resetGame : () => setIsPaused(false)}
                  className="px-8 py-2 bg-white text-black font-mono rounded-full hover:bg-gray-200 transition-colors"
                >
                  {isGameOver ? 'PLAY AGAIN' : 'RESUME'}
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 text-white/40 text-sm text-center font-mono tracking-wider">
            ARROWS OR SWIPE TO MOVE • SPACE TO PAUSE
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
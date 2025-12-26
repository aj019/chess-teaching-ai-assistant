import React, { useRef, useCallback, useEffect, useState } from 'react';
import './GameInfo.css';
import Markdown from 'react-markdown';

const GameInfo = ({ gameState, onNewGame, onRefresh, onAnalysisToggle, onNextMove }) => {
  const intervalRef = useRef(null);
  const [isLooping, setIsLooping] = useState(false);

  useEffect(() => {
    // Stop the loop if the game is over
    if (gameState?.is_game_over && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsLooping(false);
    }
    // Cleanup on component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, [gameState?.is_game_over]);

  const handleStartNextMoveLoop = useCallback(() => {
    // If already running, don't start again
    if (intervalRef.current || isLooping) return;

    setIsLooping(true);
    // Call immediately for instant feedback
    onNextMove();

    intervalRef.current = setInterval(() => {
      if (gameState?.is_game_over) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsLooping(false);
        return;
      }
      onNextMove();
    }, 10000);
  }, [onNextMove, gameState?.is_game_over, isLooping]);

  const handleStopNextMoveLoop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsLooping(false);
    }
  };

  if (!gameState) return null;

  const getStatusMessage = () => {
    if (gameState.is_checkmate) {
      return `Checkmate! ${gameState.turn === 'white' ? 'Black' : 'White'} wins!`;
    }
    if (gameState.is_stalemate) {
      return 'Stalemate! Game is a draw.';
    }
    if (gameState.is_check) {
      return `${gameState.turn === 'white' ? 'White' : 'Black'} is in check!`;
    }
    if (gameState.is_game_over) {
      return 'Game Over';
    }
    return `${gameState.turn === 'white' ? 'White' : 'Black'}'s turn`;
  };

  return (
    <div className="game-info">
      <div className="status-section">
        <h2>Game Status</h2>
        <div className={`status-message ${gameState.is_checkmate ? 'checkmate' : ''} ${gameState.is_check ? 'check' : ''}`}>
          {getStatusMessage()}
        </div>
      </div>

      <div className="move-history-section">
        <h3>Move History</h3>
        <div className="move-history">
          {gameState.move_history.length === 0 ? (
            <p className="no-moves">No moves yet</p>
          ) : (
            <div className="moves-list">
              {gameState.move_history.map((move, index) => (
                <span key={index} className="move">
                  {Math.floor(index / 2) + 1}.{index % 2 === 0 ? ' ' : ' '}
                  {move}
                  {index % 2 === 1 && <br />}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="actions-section">
        <button onClick={onNewGame} className="btn btn-primary">
          New Game
        </button>
        {/* <button onClick={onRefresh} className="btn btn-secondary">
          Refresh
        </button> */}
        <button onClick={onAnalysisToggle} className="btn btn-secondary">
          {gameState.is_analysis_on ? 'Disable Analysis' : 'Enable Analysis'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={isLooping ? handleStopNextMoveLoop : handleStartNextMoveLoop}
          disabled={gameState.is_game_over}
        >
          {isLooping ? "Stop Match" : "Start Match"}
        </button>
      </div>

      <div className="info-section">
        <p><strong>Legal Moves:</strong> {gameState.legal_moves.length}</p>
        <p><strong>FEN:</strong> <code>{gameState.fen}</code></p>
      </div>

      <div className="info-section">
        <h3>Analysis</h3>
        <p><Markdown>{gameState.analysis}</Markdown></p>
      </div>
    </div>
  );
};

export default GameInfo;


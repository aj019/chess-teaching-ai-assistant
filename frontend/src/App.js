import React, { useState, useEffect } from 'react';
import './App.css';
import ChessBoard from './components/ChessBoard';
import GameInfo from './components/GameInfo';
import { createGame, getGame, makeMove as apiMakeMove, toggleAnalysis as apiToggleAnalysis, makeNextMove as apiNextMove } from './services/api';

function App() {
  const [gameId, setGameId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [selectedSquarePieceColor, setSelectedSquarePieceColor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = async () => {
    setLoading(true);
    setError(null);
    try {
      const game = await createGame();
      setGameId(game.game_id);
      setGameState(game);
      setSelectedSquare(null);
    } catch (err) {
      setError('Failed to create game: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSquareClick = async (square, isWhitePiece, isWhiteTurn) => {
    if (!gameId || !gameState || gameState.is_game_over) return;
    console.log("selectedSquare", selectedSquare);
    console.log("square", square);
    
    if (!selectedSquare) {
      // First click: select the square
      setSelectedSquare(square);
      setSelectedSquarePieceColor(isWhitePiece);
    } else {
      // if(isWhiteTurn && !isWhitePiece) {
      //   return;
      // }
      // Second click: make the move
      if (selectedSquare === square) {
        // Deselect if clicking the same square
        setSelectedSquare(null);
        return;
      }

      if(selectedSquarePieceColor === isWhitePiece) {
        setSelectedSquare(square);
        setSelectedSquarePieceColor(isWhitePiece);
        return;
      }

      const move = selectedSquare + square;
      setLoading(true);
      setError(null);
      
      try {
        const updatedGame = await apiMakeMove(gameId, move);
        setGameState(updatedGame);
        setSelectedSquare(null);
      } catch (err) {
        setError('Invalid move: ' + (err.response?.data?.detail || err.message));
        setSelectedSquare(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const refreshGame = async () => {
    if (!gameId) return;
    try {
      const game = await getGame(gameId);
      setGameState(game);
    } catch (err) {
      setError('Failed to refresh game: ' + err.message);
    }
  };

  const toggleAnalysis = async () => {
    if (!gameId) return;
    try {
      const game = await apiToggleAnalysis(gameId);
      setGameState(game);
    } catch (err) {
      setError('Failed to toggle analysis: ' + err.message);
    }
  };

  const nextMove = async () => {
    if (!gameId) return;
    try {
      setLoading(true);
      setError(null);
      const game = await apiNextMove(gameId);
      setGameState(game);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Failed to get next move: ' + err.message);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Chess Game - Claude Opus 4.5 (Black) vs GPT 5.2 (White)</h1>
        
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="game-container">
          {gameState && (
            <>
              <ChessBoard
                gameState={gameState}
                selectedSquare={selectedSquare}
                onSquareClick={handleSquareClick}
                loading={loading}
              />
              <GameInfo
                gameState={gameState}
                onNewGame={startNewGame}
                onRefresh={refreshGame}
                onAnalysisToggle={toggleAnalysis}
                onNextMove={nextMove}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;


import React from 'react';
import './ChessBoard.css';

const LoaderWithText = ({ turn }) => (
  <div className="loader-overlay" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    <div className="loader-spinner" />
    <div style={{ color: '#333', fontWeight: 'bold', marginTop: 16, fontSize: 22 }}>
      {turn === 'white' ? 'GPT 5.2 (White) Thinking ' : 'Claude Opus 4.5 (Black) Thinking '}
    </div>
  </div>
);

const ChessBoard = ({ gameState, selectedSquare, onSquareClick, loading }) => {
  if (!gameState) return null;

  const squares = [];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  // Parse FEN to get piece positions
  // FEN notation: rank 8 (top) to rank 1 (bottom)
  const parseFEN = (fen) => {
    const board = {};
    const parts = fen.split(' ');
    const position = parts[0];
    let rank = 8;  // Start with rank 8 (top of board)
    let file = 0;

    for (let char of position) {
      if (char === '/') {
        rank--;  // Move to next rank (down the board)
        file = 0;
      } else if (char >= '1' && char <= '8') {
        file += parseInt(char);
      } else {
        // Create square name: file letter + rank number
        // rank 8 -> '8', rank 1 -> '1'
        const square = files[file] + rank.toString();
        board[square] = char;
        file++;
      }
    }
    return board;
  };

  const piecePositions = parseFEN(gameState.fen);

  // Get legal moves for selected square
  const getLegalMovesForSquare = (square) => {
    if (!selectedSquare || selectedSquare !== square) return [];
    return gameState.legal_moves.filter(move => move.startsWith(square));
  };

  const legalMoves = selectedSquare ? getLegalMovesForSquare(selectedSquare) : [];

  const getPieceSymbol = (piece) => {
    const symbols = {
      'P': '♙', 'R': '♜', 'N': '♞', 'B': '♝', 'Q': '♛', 'K': '♚',
      'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚'
    };
    return symbols[piece] || '';
  };

  const isLightSquare = (file, rank) => {
    return (file + rank) % 2 === 0;
  };

  const isLegalMoveTarget = (square) => {
    return legalMoves.some(move => move.slice(2) === square);
  };

  // Render board: rank 8 (top) to rank 1 (bottom)
  // This creates rows from top to bottom
  for (let rank = 8; rank >= 1; rank--) {
    for (let file = 0; file < 8; file++) {
      const square = files[file] + rank.toString();
      const piece = piecePositions[square];
      const isLight = isLightSquare(file, rank);
      const isSelected = selectedSquare === square;
      const isLegalTarget = isLegalMoveTarget(square);
      const isWhitePiece = piece && piece === piece.toUpperCase();
      const isCurrentTurn = gameState.turn === 'white' ? isWhitePiece : !isWhitePiece;
      const isWhiteTurn = gameState.turn === 'white';
      squares.push(
        <div
          key={square}
          className={`square ${isLight ? 'light' : 'dark'} ${
            isSelected ? 'selected' : ''
          } ${isLegalTarget ? 'legal-move' : ''} ${
            loading ? 'loading' : ''
          }`}
          onClick={() => {
            if (!loading && (piece || isLegalTarget || isSelected)) {
              onSquareClick(square, isWhitePiece, isWhiteTurn);
            }
          }}
        >
          {piece && (
            <span className={`piece ${isCurrentTurn ? 'current-turn' : ''}`} style={{ color: isWhitePiece ? 'white' : 'black' }}>
              {getPieceSymbol(piece)}
            </span>
          )}
          {isLegalTarget && !piece && <div className="legal-move-indicator" />}
        </div>
      );
    }
  }

  return (
    <div className="chess-board-container" style={{ position: 'relative' }}>
      {loading && <LoaderWithText turn={gameState.turn} />}
      <div className="chess-board">
        {squares}
      </div>
      <div className="board-labels">
        <div className="file-labels">
          {files.map(file => (
            <span key={file}>{file}</span>
          ))}
        </div>
        <div className="rank-labels">
          {ranks.map(rank => (
            <span key={rank}>{rank}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;
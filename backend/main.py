from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chess
import chess.svg
import chess.engine
from typing import Optional, List
import uuid
import random
app = FastAPI(title="Chess Game API")

ENGINE_PATH = "/usr/local/bin/stockfish"

# CORS middleware to allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory game storage (in production, use a database)
games = {}


class GameCreate(BaseModel):
    pass


class MoveRequest(BaseModel):
    move: str  # UCI format (e.g., "e2e4") or SAN format (e.g., "e4")


class GameResponse(BaseModel):
    game_id: str
    fen: str
    turn: str
    is_check: bool
    is_checkmate: bool
    is_stalemate: bool
    is_game_over: bool
    legal_moves: List[str]
    move_history: List[str]
    board_svg: str


@app.get("/")
def read_root():
    return {"message": "Chess Game API"}


@app.post("/api/games", response_model=GameResponse)
def create_game():
    """Create a new chess game"""
    game_id = str(uuid.uuid4())
    board = chess.Board()
    games[game_id] = board
    
    return get_game_state(game_id)


@app.get("/api/games/{game_id}", response_model=GameResponse)
def get_game(game_id: str):
    """Get the current state of a game"""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    return get_game_state(game_id)


@app.post("/api/games/{game_id}/move", response_model=GameResponse)
def make_move(game_id: str, move_request: MoveRequest):
    """Make a move in the game"""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    board = games[game_id]
    
    # Try to parse the move
    try:
        # First try UCI format
        move = chess.Move.from_uci(move_request.move)
    except ValueError:
        try:
            # If that fails, try SAN format
            move = board.parse_san(move_request.move)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid move format")
    
    # Check if move is legal
    if move not in board.legal_moves:
        raise HTTPException(status_code=400, detail="Illegal move")
    
    # Make the move
    board.push(move)

    engine = chess.engine.SimpleEngine.popen_uci(ENGINE_PATH)
    limit = chess.engine.Limit(time=0.1) # Think for 0.1 seconds
    result = engine.play(board, limit)

    print("result :", result.move.uci())

    # if it's black's turn, make the first legal move
    if(board.turn == chess.BLACK):
        board.push(chess.Move.from_uci(result.move.uci()))
    
    return get_game_state(game_id)


@app.get("/api/games/{game_id}/legal-moves")
def get_legal_moves(game_id: str, square: Optional[str] = None):
    """Get legal moves. If square is provided, get moves for that square only."""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    board = games[game_id]
    
    if square:
        try:
            square_index = chess.parse_square(square)
            legal_moves = [
                move.uci() for move in board.legal_moves 
                if move.from_square == square_index
            ]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid square")
    else:
        legal_moves = [move.uci() for move in board.legal_moves]
    
    return {"legal_moves": legal_moves}


@app.delete("/api/games/{game_id}")
def delete_game(game_id: str):
    """Delete a game"""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    del games[game_id]
    return {"message": "Game deleted"}


def get_game_state(game_id: str) -> GameResponse:
    """Helper function to get game state"""
    board = games[game_id]
    
    # Get legal moves as UCI strings
    legal_moves = [move.uci() for move in board.legal_moves]
    
    # Get move history
    move_history = []
    temp_board = chess.Board()
    for move in board.move_stack:
        move_history.append(temp_board.san(move))
        temp_board.push(move)
    
    # Generate SVG board
    board_svg = chess.svg.board(board, size=400)
    
    return GameResponse(
        game_id=game_id,
        fen=board.fen(),
        turn="white" if board.turn == chess.WHITE else "black",
        is_check=board.is_check(),
        is_checkmate=board.is_checkmate(),
        is_stalemate=board.is_stalemate(),
        is_game_over=board.is_game_over(),
        legal_moves=legal_moves,
        move_history=move_history,
        board_svg=board_svg
    )


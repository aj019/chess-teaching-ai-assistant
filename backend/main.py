from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chess
import chess.svg
import chess.engine
from typing import Optional, List
import uuid
import random
import openai
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Chess Game API")

ENGINE_PATH = "/usr/local/bin/stockfish"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


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
games_metadata = {}


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
    analysis: str
    is_analysis_on: bool


@app.get("/")
def read_root():
    return {"message": "Chess Game API"}


@app.post("/api/games", response_model=GameResponse)
def create_game():
    """Create a new chess game"""
    game_id = str(uuid.uuid4())
    board = chess.Board()
    games[game_id] = board
    games_metadata[game_id] = {
        "is_analysis_on": False
    }
    return get_game_state(game_id)


@app.get("/api/games/{game_id}", response_model=GameResponse)
def get_game(game_id: str):
    """Get the current state of a game"""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    return get_game_state(game_id)


@app.post("/api/games/{game_id}/toggle-analysis", response_model=GameResponse)
def toggle_analysis(game_id: str):
    """Toggle analysis on or off"""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    games_metadata[game_id]['is_analysis_on'] = not games_metadata[game_id]['is_analysis_on']
    return get_game_state(game_id)

@app.post("/api/games/{game_id}/move", response_model=GameResponse)
def make_move(game_id: str, move_request: MoveRequest):
    """Make a move in the game"""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    board = games[game_id]
    metadata = games_metadata[game_id]
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

    # if it's black's turn, make the first legal move
    if(board.turn == chess.BLACK):
        board.push(chess.Move.from_uci(result.move.uci()))

    # Afte the above line of code it's white's turn    
    suggest_move_for_white = engine.play(board, limit)
    print("suggest_move_for_white :", suggest_move_for_white.move.uci())

    temp_board = chess.Board()
    move_history = []
    for move in board.move_stack:
        move_history.append(temp_board.san(move))
        temp_board.push(move)

    fen = board.fen()
    suggested_move = suggest_move_for_white.move.uci()

    analysis = ""
    if metadata["is_analysis_on"]:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", 
                "content": """You are an expert chess player. 
                Help explain the reasoning behind the move played by the player and suggest 
                if a better move is available otherwise explain why the move is good. 
                The moves are being suggested by a chess engine which will only suggest legal moves.
                Do not question the move suggested by the engine instead explain the reasoning behind the move or if you find a better move suggest it.
                You will also be give the history of the moves played so far and
                the board state at the time of the move. Keep the reply brief and to the point."""},
                { "role": "user", 
                "content": f"""
                    Here is the history of the moves along with the board state and also the suggested move.
                    "move_history": {move_history},
                    "board_state": {fen},
                    "suggested_move": {suggested_move}
                """
                }
            ]
        )

        analysis = response.choices[0].message.content
    

    
    
    return get_game_state(game_id, analysis)


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


def get_game_state(game_id: str, analysis: str = "") -> GameResponse:
    """Helper function to get game state"""
    board = games[game_id]
    metadata = games_metadata[game_id]
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
        board_svg=board_svg,
        analysis=analysis,
        is_analysis_on=metadata['is_analysis_on']
    )


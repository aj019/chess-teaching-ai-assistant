# Chess Game - React Frontend with FastAPI Backend

A full-stack chess game application with a React frontend and Python FastAPI backend using python-chess for game logic.

## Features

- Interactive chess board with piece movement
- Move validation using python-chess
- Game state tracking (check, checkmate, stalemate)
- Move history display
- Legal move highlighting
- Responsive design

## Project Structure

```
chess-teaching-assistant/
├── backend/
│   └── main.py          # FastAPI backend server
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API service functions
│   │   └── App.js       # Main React app
│   └── package.json
├── requirements.txt     # Python dependencies
└── README.md
```

## Setup Instructions

### Backend Setup

1. Create and activate a virtual environment (if not already done):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the FastAPI server:
```bash
cd backend
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

- `POST /api/games` - Create a new game
- `GET /api/games/{game_id}` - Get game state
- `POST /api/games/{game_id}/move` - Make a move (UCI format: "e2e4")
- `GET /api/games/{game_id}/legal-moves` - Get legal moves
- `DELETE /api/games/{game_id}` - Delete a game

## How to Play

1. Click on a piece to select it (highlighted in yellow)
2. Click on a valid destination square to make a move
3. Legal moves are shown with a small dot indicator
4. The game automatically detects check, checkmate, and stalemate

## Technologies Used

- **Backend**: FastAPI, python-chess, Uvicorn
- **Frontend**: React, Axios
- **Styling**: CSS3 with modern design


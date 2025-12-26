import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createGame = async () => {
  const response = await api.post('/api/games');
  return response.data;
};

export const getGame = async (gameId) => {
  const response = await api.get(`/api/games/${gameId}`);
  return response.data;
};

export const makeMove = async (gameId, move) => {
  const response = await api.post(`/api/games/${gameId}/move`, { move });
  return response.data;
};

export const makeNextMove = async (gameId, move) => {
  const response = await api.post(`/api/games/${gameId}/next-move`, { move });
  return response.data;
};

export const toggleAnalysis = async (gameId) => {
  const response = await api.post(`/api/games/${gameId}/toggle-analysis`);
  return response.data;
};

export const getLegalMoves = async (gameId, square = null) => {
  const params = square ? { square } : {};
  const response = await api.get(`/api/games/${gameId}/legal-moves`, { params });
  return response.data;
};

export const deleteGame = async (gameId) => {
  const response = await api.delete(`/api/games/${gameId}`);
  return response.data;
};


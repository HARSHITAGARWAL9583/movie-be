import express from 'express';
import {
  getRecommendations,
  searchMovies,
  getPopularMovies,
  getCatalogMovies,
  getMovieById,
  addToFavorites,
  addToWishlist,
  addToHistory,
  getUserProfile,
} from '../controllers/movieController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Movie routes (no auth needed for search and recommendations)
router.get('/recommend', getRecommendations);
router.get('/search', searchMovies);
router.get('/popular', getPopularMovies);
router.get('/catalog', getCatalogMovies);
router.get('/movie/:movieId', getMovieById);

// User routes (auth required)
router.post('/favorite', authMiddleware, addToFavorites);
router.post('/wishlist', authMiddleware, addToWishlist);
router.post('/history', authMiddleware, addToHistory);
router.get('/profile', authMiddleware, getUserProfile);

export default router;

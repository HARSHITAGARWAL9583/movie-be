import express from 'express';
import {
  getRecommendations,
  searchMovies,
<<<<<<< HEAD
  getPopularMovies,
  getCatalogMovies,
  getMovieById,
=======
>>>>>>> b34c7aee01a2b775b9b3cd4660e2f71a63c24ece
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
<<<<<<< HEAD
router.get('/popular', getPopularMovies);
router.get('/catalog', getCatalogMovies);
router.get('/movie/:movieId', getMovieById);
=======
>>>>>>> b34c7aee01a2b775b9b3cd4660e2f71a63c24ece

// User routes (auth required)
router.post('/favorite', authMiddleware, addToFavorites);
router.post('/wishlist', authMiddleware, addToWishlist);
router.post('/history', authMiddleware, addToHistory);
router.get('/profile', authMiddleware, getUserProfile);

export default router;

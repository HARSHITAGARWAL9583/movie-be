import express from 'express';
import {
  getRecommendations,
  searchMovies,
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

// User routes (auth required)
router.post('/favorite', authMiddleware, addToFavorites);
router.post('/wishlist', authMiddleware, addToWishlist);
router.post('/history', authMiddleware, addToHistory);
router.get('/profile', authMiddleware, getUserProfile);

export default router;

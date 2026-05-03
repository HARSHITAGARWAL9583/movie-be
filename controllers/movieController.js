import User from '../models/User.js';
import { getGeminiRecommendations, getTMDBMovieDetails, getYoutubeTrailer } from '../utils/externalAPIs.js';

// Get movie recommendations based on filters
const getRecommendations = async (req, res) => {
  try {
    const { genre, mood, year, rating } = req.query;

    if (!genre || !mood || !year || !rating) {
      return res.status(400).json({ message: 'All filters are required' });
    }

    // Get movie names from Gemini
    const movieNames = await getGeminiRecommendations({
      genre,
      mood,
      year,
      rating,
    });

    // Get movie details from TMDB for each movie
    const movieDetails = [];
    for (const movieName of movieNames) {
      const details = await getTMDBMovieDetails(movieName);
      if (details) {
        movieDetails.push(details);
      }
    }

    // Get trailers for each movie
    const moviesWithTrailers = await Promise.all(
      movieDetails.map(async (movie) => {
        const trailer = await getYoutubeTrailer(movie.title);
        return { ...movie, trailer };
      })
    );

    res.status(200).json({
      message: 'Recommendations fetched successfully',
      movies: moviesWithTrailers,
    });
  } catch (error) {
    console.error(`❌ Get Recommendations Error: ${error.message}`);
    res.status(500).json({ message: 'Failed to get recommendations', error: error.message });
  }
};

// Search movies by title
const searchMovies = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Get movie details from TMDB
    const details = await getTMDBMovieDetails(query);

    if (!details) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Get trailer
    const trailer = await getYoutubeTrailer(details.title);

    res.status(200).json({
      message: 'Movie found',
      movie: { ...details, trailer },
    });
  } catch (error) {
    console.error(`❌ Search Movies Error: ${error.message}`);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
};

// Add movie to favorites
const addToFavorites = async (req, res) => {
  try {
    const { movieName, movieId } = req.body;
    const userId = req.userId;
    const item = movieName || movieId;

    if (!item) {
      return res.status(400).json({ message: 'Movie name is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add to favorites if not already added
    if (!user.favorites.includes(item)) {
      user.favorites.push(item);
      await user.save();
    }

    res.status(200).json({ message: 'Added to favorites', favorites: user.favorites });
  } catch (error) {
    console.error(`❌ Add to Favorites Error: ${error.message}`);
    res.status(500).json({ message: 'Failed to add to favorites', error: error.message });
  }
};

// Add movie to wishlist
const addToWishlist = async (req, res) => {
  try {
    const { movieId } = req.body;
    const userId = req.userId;

    if (!movieId) {
      return res.status(400).json({ message: 'Movie ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add to wishlist if not already added
    if (!user.wishlist.includes(movieId)) {
      user.wishlist.push(movieId);
      await user.save();
    }

    res.status(200).json({ message: 'Added to wishlist', wishlist: user.wishlist });
  } catch (error) {
    console.error(`❌ Add to Wishlist Error: ${error.message}`);
    res.status(500).json({ message: 'Failed to add to wishlist', error: error.message });
  }
};

// Add movie to watch history
const addToHistory = async (req, res) => {
  try {
    const { movieName, movieId } = req.body;
    const userId = req.userId;
    const item = movieName || movieId;

    if (!item) {
      return res.status(400).json({ message: 'Movie name is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add to history (allow duplicates to track watch count)
    user.history.push(item);
    await user.save();

    res.status(200).json({ message: 'Added to history', history: user.history });
  } catch (error) {
    console.error(`❌ Add to History Error: ${error.message}`);
    res.status(500).json({ message: 'Failed to add to history', error: error.message });
  }
};

// Get user profile with favorites, wishlist, history
const getUserProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select('-password -otp -otpExpiry');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User profile fetched',
      user,
    });
  } catch (error) {
    console.error(`❌ Get User Profile Error: ${error.message}`);
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
};

export { getRecommendations, searchMovies, addToFavorites, addToWishlist, addToHistory, getUserProfile };

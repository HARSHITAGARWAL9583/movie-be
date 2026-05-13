import User from '../models/User.js';
import { getYoutubeTrailer } from '../utils/externalAPIs.js';
import { getMovieCatalog, getMovieById as getCatalogMovieById, recommendMovies } from '../utils/movieCatalog.js';

// Get movie recommendations based on filters
const getRecommendations = async (req, res) => {
  try {
    const { genre, mood, year, rating, selectedMovieId } = req.query;
    const movies = await recommendMovies({ genre, mood, year, rating, selectedMovieId, limit: 12 });

    const moviesWithTrailers = await Promise.all(
      movies.map(async (movie) => ({
        ...movie,
        trailer: movie.trailer || (await getYoutubeTrailer(movie.title)),
      }))
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
    const { query = '', genre = '', limit = 20 } = req.query;
    const catalog = getMovieCatalog({ query, genre, limit });

    res.status(200).json({
      message: 'Movies fetched successfully',
      movies: catalog.movies,
      movie: catalog.movies[0] || null,
      total: catalog.total,
    });
  } catch (error) {
    console.error(`❌ Search Movies Error: ${error.message}`);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
};

// Get popular movies from TMDB
const getPopularMovies = async (req, res) => {
  try {
    const { query = '', limit = 30 } = req.query;
    const catalog = getMovieCatalog({ query, limit });

    res.status(200).json({
      message: 'Popular movies fetched successfully',
      movies: catalog.movies,
      total: catalog.total,
    });
  } catch (error) {
    console.error(`❌ Get Popular Movies Error: ${error.message}`);
    res.status(500).json({ message: 'Failed to get popular movies', error: error.message });
  }
};

// Get catalog movies for dropdown/search
const getCatalogMovies = async (req, res) => {
  try {
    const { query = '', genre = '', limit = 60 } = req.query;
    const catalog = getMovieCatalog({ query, genre, limit });

    res.status(200).json({
      message: 'Catalog fetched successfully',
      movies: catalog.movies,
      total: catalog.total,
    });
  } catch (error) {
    console.error(`❌ Get Catalog Error: ${error.message}`);
    res.status(500).json({ message: 'Failed to get catalog', error: error.message });
  }
};

// Get movie details by TMDB id
const getMovieById = async (req, res) => {
  try {
    const { movieId } = req.params;
    const movie = await getCatalogMovieById(movieId);

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const relatedMovies = await recommendMovies({
      genre: movie.genres?.[0] || '',
      mood: '',
      year: '',
      rating: '',
      selectedMovieId: movie.id,
      limit: 8,
    });

    res.status(200).json({
      message: 'Movie fetched successfully',
      movie,
      relatedMovies,
      trailer: await getYoutubeTrailer(movie.title),
    });
  } catch (error) {
    console.error(`❌ Get Movie By ID Error: ${error.message}`);
    res.status(500).json({ message: 'Failed to get movie details', error: error.message });
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
    const { movieName, movieId } = req.body;
    const userId = req.userId;
    const item = movieName || movieId;

    if (!item) {
      return res.status(400).json({ message: 'Movie name or ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add to wishlist if not already added
    if (!user.wishlist.includes(item)) {
      user.wishlist.push(item);
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

export { getRecommendations, searchMovies, getPopularMovies, getCatalogMovies, getMovieById, addToFavorites, addToWishlist, addToHistory, getUserProfile };

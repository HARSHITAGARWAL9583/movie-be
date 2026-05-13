import 'dotenv/config';
import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const FALLBACK_MOVIES = [
  'Inception',
  'The Dark Knight',
  'Interstellar',
  'Parasite',
  'The Matrix',
  'Gladiator',
  'John Wick',
  'Avengers: Endgame',
  'Spider-Man: Into the Spider-Verse',
  'Whiplash'
];

// Gemini API - Get movie recommendations
export const getGeminiRecommendations = async (filters) => {
  try {
    const prompt = `Suggest 10 popular movies based on these filters:
    - Genre: ${filters.genre}
    - Mood: ${filters.mood}
    - Release Year: ${filters.year}
    - Rating: ${filters.rating}
    
    Return ONLY the movie names, one per line. No explanations or numbering.`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract movie names from response
    const movieNames = text
      .split('\n')
      .map((name) => name.replace(/^[-\d\.)\s]+/, '').trim())
      .filter((name) => name.trim())
      .slice(0, 10);

    return movieNames.length > 0 ? movieNames : FALLBACK_MOVIES;
  } catch (error) {
    console.error('❌ Gemini API Error:', error.response?.data || error.message);
    return FALLBACK_MOVIES;
  }
};

const fetchTMDBJson = async (url) => {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        Accept: 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      const retryResponse = await axios.get(url, {
        timeout: 10000,
        headers: {
          Accept: 'application/json',
        },
      });

      return retryResponse.data;
    }

    throw error;
  }
};

// TMDB API - Get movie details
export const getTMDBMovieDetails = async (movieName) => {
  try {
    // Search for movie by name
    const searchData = await fetchTMDBJson(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieName)}&language=en-US&page=1&include_adult=false`
    );

    if (!searchData.results || searchData.results.length === 0) {
      return null;
    }

    const movie = searchData.results[0];

    // Get additional details
    const detailsData = await fetchTMDBJson(
      `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=en-US`
    );

    return {
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      backdropPath: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
      rating: movie.vote_average,
      releaseDate: movie.release_date,
      genres: (detailsData.genres || []).map((g) => g.name),
      runtime: detailsData.runtime,
    };
  } catch (error) {
    console.warn(`TMDB fallback for "${movieName}": ${error.message}`);
    return {
      id: movieName,
      title: movieName,
      overview: 'Movie details are temporarily unavailable. Showing a fallback card for now.',
      posterPath: null,
      backdropPath: null,
      rating: 8.0,
      releaseDate: null,
      genres: [],
      runtime: null,
    };
  }
};

// YouTube API - Get trailer
export const getYoutubeTrailer = async (movieName) => {
  try {
<<<<<<< HEAD
    const query = encodeURIComponent(`${movieName} trailer official`);
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&q=${query}&part=snippet&type=video&maxResults=1`
=======
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&q=${movieName} trailer&part=snippet&type=video&maxResults=1`
>>>>>>> b34c7aee01a2b775b9b3cd4660e2f71a63c24ece
    );

    if (response.data.items.length === 0) {
      return null;
    }

    const videoId = response.data.items[0].id.videoId;
<<<<<<< HEAD
    return `https://www.youtube.com/watch?v=${videoId}`;
=======
    return `https://www.youtube.com/embed/${videoId}`;
>>>>>>> b34c7aee01a2b775b9b3cd4660e2f71a63c24ece
  } catch (error) {
    console.error(`❌ YouTube API Error for "${movieName}":`, error.message);
    return null;
  }
};
<<<<<<< HEAD

// TMDB API - Get popular movies
export const getTMDBPopularMovies = async () => {
  try {
    const response = await fetchTMDBJson(
      `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`
    );

    if (!response.results) {
      return [];
    }

    // Get details for each movie including genres
    const moviesWithDetails = await Promise.all(
      response.results.slice(0, 30).map(async (movie) => {
        try {
          const detailsData = await fetchTMDBJson(
            `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=en-US`
          );

          return {
            id: movie.id,
            title: movie.title,
            overview: movie.overview,
            posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
            backdropPath: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
            rating: movie.vote_average,
            releaseDate: movie.release_date,
            genres: (detailsData.genres || []).map((g) => g.name),
            runtime: detailsData.runtime,
          };
        } catch (err) {
          // Return minimal data if details fail
          return {
            id: movie.id,
            title: movie.title,
            overview: movie.overview,
            posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
            backdropPath: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
            rating: movie.vote_average,
            releaseDate: movie.release_date,
            genres: [],
            runtime: null,
          };
        }
      })
    );

    return moviesWithDetails;
  } catch (error) {
    console.error('❌ TMDB Popular Movies Error:', error.message);
    return [];
  }
};
=======
>>>>>>> b34c7aee01a2b775b9b3cd4660e2f71a63c24ece

import axios from 'axios';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATASET_PATH = resolve(__dirname, '../../tmdb_5000_movies.csv');

let cachedMovies = null;
const tmdbAssetCache = new Map();

const toNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const normalizeText = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const parseArrayField = (value, key = 'name') => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        return item?.[key] || item?.name || item?.original_name || '';
      })
      .filter(Boolean);
  } catch {
    return [];
  }
};

const normalizeGenreName = (genre) => {
  const normalized = normalizeText(genre);
  const aliasMap = {
    'sci fi': 'Science Fiction',
    'science fiction': 'Science Fiction',
    'rom com': 'Romance',
    'romance': 'Romance',
    'family': 'Family',
    'thriller': 'Thriller',
    'action': 'Action',
    'comedy': 'Comedy',
    'drama': 'Drama',
    'horror': 'Horror',
    'mystery': 'Mystery',
    'crime': 'Crime',
    'fantasy': 'Fantasy',
    'adventure': 'Adventure',
    'animation': 'Animation',
    'history': 'History',
    'war': 'War',
    'western': 'Western',
  };

  return aliasMap[normalized] || genre;
};

const MOVIE_MOOD_PROFILES = {
  thrilling: {
    genres: ['Thriller', 'Action', 'Crime', 'Mystery', 'Adventure'],
    keywords: ['suspense', 'mystery', 'crime', 'revenge', 'spy', 'escape', 'war', 'terrorist'],
  },
  funny: {
    genres: ['Comedy', 'Animation', 'Family', 'Adventure'],
    keywords: ['comedy', 'friend', 'funny', 'prank', 'buddy', 'school', 'party'],
  },
  emotional: {
    genres: ['Drama', 'Romance', 'Family'],
    keywords: ['love', 'relationship', 'family', 'heart', 'loss', 'marriage', 'emotional'],
  },
  dark: {
    genres: ['Thriller', 'Horror', 'Crime', 'Mystery'],
    keywords: ['murder', 'death', 'killer', 'dark', 'crime', 'violence', 'suspense'],
  },
};

const loadMovies = () => {
  if (cachedMovies) {
    return cachedMovies;
  }

  const csvContent = readFileSync(DATASET_PATH, 'utf8');
  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    bom: true,
    trim: true,
  });

  cachedMovies = rows.map((row) => {
    const releaseDate = row.release_date || null;
    const releaseYear = releaseDate ? Number(releaseDate.slice(0, 4)) : null;

    return {
      id: toNumber(row.id),
      title: row.title || row.original_title || 'Untitled',
      originalTitle: row.original_title || row.title || 'Untitled',
      overview: row.overview || '',
      tagline: row.tagline || '',
      genres: parseArrayField(row.genres),
      keywords: parseArrayField(row.keywords),
      productionCompanies: parseArrayField(row.production_companies),
      productionCountries: parseArrayField(row.production_countries),
      spokenLanguages: parseArrayField(row.spoken_languages),
      originalLanguage: row.original_language || '',
      status: row.status || '',
      homepage: row.homepage || '',
      budget: toNumber(row.budget),
      revenue: toNumber(row.revenue),
      runtime: toNumber(row.runtime),
      popularity: toNumber(row.popularity) || 0,
      voteAverage: toNumber(row.vote_average) || 0,
      voteCount: toNumber(row.vote_count) || 0,
      releaseDate,
      releaseYear,
      posterPath: null,
      backdropPath: null,
    };
  });

  return cachedMovies;
};

const movieToResponse = (movie) => ({
  id: movie.id,
  title: movie.title,
  originalTitle: movie.originalTitle,
  overview: movie.overview,
  tagline: movie.tagline,
  genres: movie.genres,
  keywords: movie.keywords,
  productionCompanies: movie.productionCompanies,
  productionCountries: movie.productionCountries,
  spokenLanguages: movie.spokenLanguages,
  originalLanguage: movie.originalLanguage,
  status: movie.status,
  homepage: movie.homepage,
  budget: movie.budget,
  revenue: movie.revenue,
  runtime: movie.runtime,
  popularity: movie.popularity,
  rating: movie.voteAverage,
  voteAverage: movie.voteAverage,
  voteCount: movie.voteCount,
  releaseDate: movie.releaseDate,
  releaseYear: movie.releaseYear,
  posterPath: movie.posterPath,
  backdropPath: movie.backdropPath,
});

const matchesYearFilter = (movie, yearFilter) => {
  if (!yearFilter || yearFilter === 'All') {
    return true;
  }

  const year = movie.releaseYear;
  if (!year) {
    return false;
  }

  if (yearFilter === 'Latest') {
    return year >= 2015;
  }

  if (yearFilter === 'Old Classics') {
    return year < 2000;
  }

  if (yearFilter === '2020+') {
    return year >= 2020;
  }

  if (yearFilter === '2015-2020') {
    return year >= 2015 && year <= 2020;
  }

  return true;
};

const matchesRatingFilter = (movie, ratingFilter) => {
  if (!ratingFilter || ratingFilter === 'All') {
    return true;
  }

  if (ratingFilter === 'Top Rated') {
    return movie.voteAverage >= 7.5;
  }

  if (ratingFilter === '8+ IMDb') {
    return movie.voteAverage >= 8;
  }

  if (ratingFilter === '7+ IMDb') {
    return movie.voteAverage >= 7;
  }

  return true;
};

const matchesMoodFilter = (movie, moodFilter) => {
  if (!moodFilter || moodFilter === 'All') {
    return true;
  }

  const profile = MOVIE_MOOD_PROFILES[normalizeText(moodFilter)];
  if (!profile) {
    return true;
  }

  const normalizedGenres = movie.genres.map(normalizeText);
  const normalizedKeywords = movie.keywords.map(normalizeText);

  return (
    profile.genres.some((genre) => normalizedGenres.includes(normalizeText(genre))) ||
    profile.keywords.some((keyword) => normalizedKeywords.some((movieKeyword) => movieKeyword.includes(normalizeText(keyword))))
  );
};

const matchesGenreFilter = (movie, genreFilter) => {
  if (!genreFilter || genreFilter === 'All') {
    return true;
  }

  const normalizedGenre = normalizeGenreName(genreFilter);
  return movie.genres.some((genre) => normalizeText(genre) === normalizeText(normalizedGenre));
};

const scoreMovie = (movie, filters = {}, selectedMovie = null) => {
  let score = movie.popularity * 0.45 + movie.voteAverage * 12 + Math.log10(movie.voteCount + 1) * 4;

  if (selectedMovie) {
    const selectedGenres = new Set((selectedMovie.genres || []).map(normalizeText));
    const selectedKeywords = new Set((selectedMovie.keywords || []).map(normalizeText));

    const genreOverlap = movie.genres.filter((genre) => selectedGenres.has(normalizeText(genre))).length;
    const keywordOverlap = movie.keywords.filter((keyword) => selectedKeywords.has(normalizeText(keyword))).length;

    score += genreOverlap * 28;
    score += Math.min(keywordOverlap, 6) * 4;

    if (movie.releaseYear && selectedMovie.releaseYear && Math.abs(movie.releaseYear - selectedMovie.releaseYear) <= 4) {
      score += 8;
    }
  }

  if (matchesGenreFilter(movie, filters.genre)) {
    score += 18;
  }

  if (matchesMoodFilter(movie, filters.mood)) {
    score += 12;
  }

  if (matchesYearFilter(movie, filters.year)) {
    score += 10;
  }

  if (matchesRatingFilter(movie, filters.rating)) {
    score += 10;
  }

  return score;
};

const getMovieCatalog = ({ query = '', genre = '', limit = 60 } = {}) => {
  const movies = loadMovies();
  const normalizedQuery = normalizeText(query);
  const normalizedGenre = genre ? normalizeText(normalizeGenreName(genre)) : '';

  let filteredMovies = movies;

  if (normalizedQuery) {
    filteredMovies = filteredMovies.filter((movie) => {
      const haystack = [movie.title, movie.originalTitle, movie.tagline, movie.overview]
        .map(normalizeText)
        .join(' ');

      return haystack.includes(normalizedQuery);
    });
  }

  if (normalizedGenre && normalizedGenre !== 'all') {
    filteredMovies = filteredMovies.filter((movie) =>
      movie.genres.some((movieGenre) => normalizeText(movieGenre) === normalizedGenre)
    );
  }

  const sortedMovies = [...filteredMovies].sort((left, right) => {
    const popularityDiff = (right.popularity || 0) - (left.popularity || 0);
    if (popularityDiff !== 0) {
      return popularityDiff;
    }

    const ratingDiff = (right.voteAverage || 0) - (left.voteAverage || 0);
    if (ratingDiff !== 0) {
      return ratingDiff;
    }

    return (right.voteCount || 0) - (left.voteCount || 0);
  });

  return {
    total: filteredMovies.length,
    movies: sortedMovies.slice(0, Math.max(1, Number(limit) || 60)).map(movieToResponse),
  };
};

const getMovieById = async (movieId) => {
  const movies = loadMovies();
  const numericMovieId = Number(movieId);
  const movie = movies.find((item) => item.id === numericMovieId);

  if (!movie) {
    return null;
  }

  const responseMovie = movieToResponse(movie);

  if (!TMDB_API_KEY) {
    return responseMovie;
  }

  if (tmdbAssetCache.has(numericMovieId)) {
    return { ...responseMovie, ...tmdbAssetCache.get(numericMovieId) };
  }

  try {
    const assetResponse = await axios.get(
      `https://api.themoviedb.org/3/movie/${numericMovieId}?api_key=${TMDB_API_KEY}&language=en-US`
    );
    const assetData = assetResponse.data || {};
    const assets = {
      posterPath: assetData.poster_path ? `https://image.tmdb.org/t/p/w500${assetData.poster_path}` : null,
      backdropPath: assetData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${assetData.backdrop_path}` : null,
    };

    tmdbAssetCache.set(numericMovieId, assets);
    return { ...responseMovie, ...assets };
  } catch {
    tmdbAssetCache.set(numericMovieId, { posterPath: null, backdropPath: null });
    return responseMovie;
  }
};

const recommendMovies = async ({ genre = '', mood = '', year = '', rating = '', selectedMovieId = null, limit = 12 } = {}) => {
  const movies = loadMovies();
  const selectedMovie = selectedMovieId ? movies.find((movie) => movie.id === Number(selectedMovieId)) : null;
  const effectiveGenre = genre || selectedMovie?.genres?.[0] || '';

  const candidates = movies.filter((movie) => {
    if (selectedMovie && movie.id === selectedMovie.id) {
      return false;
    }

    return (
      matchesGenreFilter(movie, effectiveGenre) &&
      matchesMoodFilter(movie, mood) &&
      matchesYearFilter(movie, year) &&
      matchesRatingFilter(movie, rating)
    );
  });

  const ranked = [...candidates]
    .sort((left, right) => scoreMovie(right, { genre: effectiveGenre, mood, year, rating }, selectedMovie) - scoreMovie(left, { genre: effectiveGenre, mood, year, rating }, selectedMovie))
    .slice(0, Math.max(1, Number(limit) || 12));

  const enrichedMovies = await Promise.all(
    ranked.map(async (movie) => ({
      ...movieToResponse(movie),
      ...(await getMovieById(movie.id)),
    }))
  );

  return enrichedMovies;
};

export {
  loadMovies,
  getMovieCatalog,
  getMovieById,
  recommendMovies,
  movieToResponse,
};
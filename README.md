# Movie Recommendation System - Backend

## 🛠 Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Create `.env` File
Copy the `.env` file and fill in your actual values:
```
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
GEMINI_API_KEY=your_gemini_key
TMDB_API_KEY=your_tmdb_key
YOUTUBE_API_KEY=your_youtube_key
OTP_EXPIRY_MINUTES=5
```

### 3. Run Backend
**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## 📋 API Endpoints

### Auth Routes (`/api/auth`)
- **POST** `/signup` - Create new user account
- **POST** `/verify-otp` - Verify email with OTP
- **POST** `/resend-otp` - Resend OTP to email
- **POST** `/login` - Login user

### Movie Routes (`/api/movies`)
- **GET** `/recommend?genre=Action&mood=Thrilling&year=Latest&rating=Top Rated` - Get AI recommendations
- **GET** `/search?query=movie_name` - Search movie by title
- **POST** `/favorite` - Add movie to favorites (requires JWT token)
- **POST** `/wishlist` - Add movie to wishlist (requires JWT token)
- **POST** `/history` - Add movie to watch history (requires JWT token)
- **GET** `/profile` - Get user profile with favorites, wishlist, history (requires JWT token)

## 📝 Example Requests

### Signup
```json
POST /api/auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response:**
```json
{
  "message": "User created successfully. Check your email for OTP.",
  "userId": "user_id"
}
```

### Verify OTP
```json
POST /api/auth/verify-otp
{
  "email": "john@example.com",
  "otp": "123456"
}
```

### Login
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Get Recommendations
```
GET /api/movies/recommend?genre=Action&mood=Thrilling&year=Latest&rating=Top Rated
```

**Response:**
```json
{
  "message": "Recommendations fetched successfully",
  "movies": [
    {
      "id": 123,
      "title": "Movie Name",
      "overview": "Movie description...",
      "posterPath": "https://image.tmdb.org/t/p/w500/...",
      "backdropPath": "https://image.tmdb.org/t/p/w1280/...",
      "rating": 8.5,
      "releaseDate": "2023-01-01",
      "genres": ["Action", "Thriller"],
      "runtime": 120,
      "trailer": "https://www.youtube.com/embed/..."
    }
  ]
}
```

### Search Movie
```
GET /api/movies/search?query=Inception
```

### Add to Favorites
```json
POST /api/movies/favorite
Authorization: Bearer jwt_token_here
{
  "movieId": "movie_id"
}
```

### Get User Profile
```
GET /api/movies/profile
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "message": "User profile fetched",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "isVerified": true,
    "favorites": ["movie_id_1", "movie_id_2"],
    "wishlist": ["movie_id_3"],
    "history": ["movie_id_1", "movie_id_1", "movie_id_4"],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  }
}
```

## 🗂 Folder Structure
```
backend/
├── config/
│   └── db.js             # MongoDB connection
├── controllers/
│   ├── authController.js # Auth logic
│   └── movieController.js # Movie logic
├── middleware/
│   └── auth.js           # JWT verification
├── models/
│   └── User.js           # User schema
├── routes/
│   ├── auth.js           # Auth routes
│   └── movies.js         # Movie routes
├── utils/
│   └── externalAPIs.js   # Gemini, TMDB, YouTube APIs
├── server.js             # Express app
├── .env                  # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## 🔧 How Recommendation Engine Works

1. **User selects filters** (genre, mood, year, rating)
2. **Backend sends prompt to Gemini API** with selected filters
3. **Gemini returns list of movie names** (10 movies)
4. **Backend fetches movie details from TMDB** for each movie
   - Poster image
   - Rating
   - Release date
   - Genres
   - Runtime
   - Overview
5. **Backend gets YouTube trailer** for each movie
6. **Movies are returned to frontend** with all details and trailer link

## ⚠️ Important Notes

- **Gmail Setup**: Use Gmail with App Password for Nodemailer (2FA enabled)
- **OTP**: Expires in 5 minutes, 6 digits
- **JWT Token**: Expires in 7 days
- **Passwords**: Hashed with bcryptjs (10 salt rounds)
- **TMDB API**: Free tier available, rate limits apply
- **Gemini API**: Requires valid API key, free tier available
- **YouTube API**: Requires valid API key, quota limits apply

## 🔐 Security Considerations

- All passwords are hashed before storing
- JWT tokens are signed with a secret key
- Only authenticated users can access favorites, wishlist, history
- Email verification required before login
- Rate limiting recommended for production
- CORS enabled for frontend communication

## 🚀 Deployment Notes

For production:
1. Change `JWT_SECRET` to a strong random string
2. Set `NODE_ENV=production`
3. Use environment variables from `.env` file
4. Enable rate limiting
5. Add error monitoring (Sentry, etc.)
6. Use HTTPS
7. Implement API key rotation




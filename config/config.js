module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/mern_project',
  
  JWT: {
    USER_SECRET: process.env.JWT_USER_SECRET || 'your_super_secret_user_jwt_key',
    ADMIN_SECRET: process.env.JWT_ADMIN_SECRET || 'your_super_secret_admin_jwt_key',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  
  BCRYPT_ROUNDS: 12,
  
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000,
    MAX_REQUESTS: 100,
    AUTH_MAX_REQUESTS: 5
  },
  
  CORS: {
    ORIGIN: process.env.FRONTEND_URL || 'http://localhost:3000',
    CREDENTIALS: true,
    METHODS: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  
  DEFAULT_ADMIN: {
    EMAIL: process.env.ADMIN_EMAIL || 'admin@admin.com',
    PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
    NAME: 'Administrator'
  },
  
  SOCKET: {
    CORS_ORIGIN: process.env.FRONTEND_URL || 'http://localhost:3000',
    METHODS: ['GET', 'POST'],
    CREDENTIALS: true
  },
  
  PAGINATION: {
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  },
  
  LOGGING: {
    LEVEL: process.env.LOG_LEVEL || 'info',
    MAX_FILES: 5,
    MAX_SIZE: '20m'
  }
};
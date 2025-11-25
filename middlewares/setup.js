const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('../config/config');
const requestLogger = require('../middlewares/requestLogger');

const setupMiddleware = (app) => {
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  const limiter = rateLimit({
    windowMs: config.RATE_LIMIT.WINDOW_MS,
    max: config.RATE_LIMIT.MAX_REQUESTS,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  const corsOptions = {
    origin: config.CORS.ORIGIN,
    credentials: config.CORS.CREDENTIALS,
    optionsSuccessStatus: 200,
    methods: config.CORS.METHODS,
    allowedHeaders: config.CORS.ALLOWED_HEADERS
  };
  app.use(cors(corsOptions));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use(requestLogger);

  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV
    });
  });
};

const createAuthLimiter = () => {
  return rateLimit({
    windowMs: config.RATE_LIMIT.WINDOW_MS,
    max: config.RATE_LIMIT.AUTH_MAX_REQUESTS,
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

module.exports = {
  setupMiddleware,
  createAuthLimiter
};
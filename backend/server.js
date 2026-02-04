const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

const app = express();

// 1. Security Headers (Helmet)
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. CORS Configuration
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

// 3. Body Parser & IP Protection
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(hpp()); // Prevent HTTP Parameter Pollution

// 4. Rate Limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000000,
    message: { message: 'Too many requests from this IP' },
    standardHeaders: true,
    legacyHeaders: false,
});

const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 login attempts per hour
    message: { message: 'Too many login attempts from this IP, please try again after an hour' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', loginLimiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/pages', require('./routes/pages'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/earnings', require('./routes/earnings'));
app.use('/api/withdrawals', require('./routes/withdrawals'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Tekadverse PMS API is running' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
  ✅ Server running on port ${PORT}
  📍 API: http://localhost:${PORT}/api
  🏥 Health: http://localhost:${PORT}/api/health
  `);
});
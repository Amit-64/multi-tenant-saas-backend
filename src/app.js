const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger');
const env = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const customerRoutes = require('./routes/customer.routes');
const auditRoutes = require('./routes/audit.routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();


app.set('trust proxy', 1);


app.use(helmet());


app.use(
  cors({
    origin: env.corsOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);


if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}


app.use(express.json({ limit: '10kb' }));


app.use('/api', apiLimiter);

app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});


app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/audit-logs', auditRoutes);


app.use(notFoundHandler);


app.use(errorHandler);

module.exports = app;

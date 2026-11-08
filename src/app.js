const express = require("express");
const cors = require('cors');
const helmet = require('helmet');
const morgan = require("morgan");
const env = require("./config/env");
const customerRoutes = require("./routes/customer.routes");
const auditRoutes =require('./routes/audit.routes');
const {apiLimiter} = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const userRoutes = require('./routes/user.routes');
const authRoutes = require("./routes/auth.routes");
const app = express();

app.use(helmet());

app.use(
    cors({
      origin: env.corsOrigin,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
);


app.use(express.json({limit : '10kb'}));

if (env.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

app.use('/api', apiLimiter);

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is Healthy",
    timestamp: new Date().toISOString(),
    enviroment: env.nodeEnv,
    uptime: process.uptime(),
  });
});
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users' , userRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/audit-logs', auditRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

module.exports = app;

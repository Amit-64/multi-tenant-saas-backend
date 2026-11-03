const express = require("express");
const morgan = require("morgan");
const env = require("./config/env");
const customerRoutes = require("./routes/customer.route");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./routes/auth.routes");
const app = express();

app.use(express.json());

if (env.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is Healthy",
    timestamp: new Date().toISOString(),
    enviroment: env.nodeEnv,
    uptime: process.uptime(),
  });
});
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/customers", customerRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

module.exports = app;

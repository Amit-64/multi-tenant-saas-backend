const dotenv = require("dotenv");
dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || `develpoment`,
  port: parseInt(process.env.PORT, 10) || 3000,
};

module.exports = env;

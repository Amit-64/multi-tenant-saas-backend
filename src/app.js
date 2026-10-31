const express = require('express');
const morgan = require('morgan');
const env = require('./config/env');
const {notFoundHandler , errorHandler} = require('./middleware/errorHandler');
const app = express();

app.use(express.json());

if(env.nodeEnv !== 'test'){
    app.use(morgan('dev'));
}

app.get('/api/v1/health',(req,res)=>{
    res.status(200).json({
        success : true,
        message : "Server is Healthy",
        timestamp : new Date().toISOString(),
        enviroment : env.nodeEnv,
        uptime : process.uptime()
    });
});

app.use(notFoundHandler);

app.use(errorHandler);

module.exports =app;
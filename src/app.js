const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/v1/health',(req,res)=>{
    res.status(200).json({
        success : true,
        message : "Server is Healthy",
        timestamp : new Date().toISOString(),
        uptime : process.uptime()
    });
});


module.exports =app;
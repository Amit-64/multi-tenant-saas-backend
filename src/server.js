const app = require('./app');
const env = require('./config/env');



app.listen(env.port , ()=>{
    console.log(`Server is Running in ${env.nodeEnv} mode on http://localhost:${env.port}`);
});

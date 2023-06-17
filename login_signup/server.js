require('./config/db')
// const app = require('express')();
const express = require('express');
const app = express();
const port = 3008;
// 
const cors = require("cors");
app.use(cors)

const  dotenv = require("dotenv");
dotenv.config();
const connectDB = require('./config/db')

const MONGO_URI = process.env.MONGO_URI
connectDB(MONGO_URI)
const UserRouter = require('./api/Users');

const bodyParser = require('express');
// app.use(express.json());
app.use(bodyParser());

// app.use('/user',UserRouter)

app.listen(port,()=>{
 console.log(`server running on port ${port}`);

})
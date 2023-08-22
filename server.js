const express = require('express');
const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const bodyparser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleWare/errorMiddleWare');
const cookieParser = require('cookie-parser');
const productRoute = require('./routes/productRoute');


const app = express();

//Middlewares 
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

//app.use(bodyparser.json);
app.use(bodyparser.urlencoded({
    extended: true
  }));

//Routes middleware
app.use("/api/users", userRoutes);
app.use("/api/products", productRoute)

// Routes 
app.get('/', (req, res) => {
    res.send("Home Page")
})

// Error Middleware
app.use(errorHandler)

const PORT = process.env.PORT || 5000;

//connect to mongodb and start the server
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`server running on port: ${PORT}`)
        })
    })
    .catch((err)=> console.log(err));

const express = require('express');
const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const bodyparser = require('body-parser');

const app = express();

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

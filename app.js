const express = require('express');
const colors = require('colors');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const session = require('express-session');

dotenv.config();

require('./config/db');

const app = express();
app.disable('etag');
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false,
        httpOnly: true,
        expires: false
    }
}));



app.use(
  fileUpload({
    limits: { fileSize: 20 * 1024 * 1024 },
  })
);

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});




// connection.query('SELECT 1')
//     .then(() => {
//         console.log('MySQL DB connected'.bgCyan.white);
//     })
//     .catch((error) => {
//         console.error('Error connecting to MySQL DB:', error);
//     });

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('view cache', false);


// routings 

app.use('/api', require('./routes/api')); 
app.use('/', require('./routes/web'));

module.exports  = app
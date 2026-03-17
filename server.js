// const express = require('express');
// const colors = require('colors');
// const dotenv = require('dotenv');
// const path = require('path');
// const cors = require('cors');


// const session = require('express-session');

// dotenv.config();

// require('./config/db');

// const app = express();
// app.disable('etag');
// const PORT = process.env.PORT || 3000;

// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use(session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: true,
//     cookie: { 
//         secure: false,
//         httpOnly: true,
//         expires: false
//     }
// }));

// // connection.query('SELECT 1')
// //     .then(() => {
// //         console.log('MySQL DB connected'.bgCyan.white);
// //     })
// //     .catch((error) => {
// //         console.error('Error connecting to MySQL DB:', error);
// //     });

// app.use(express.static(path.join(__dirname, 'public')));
// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));
// app.set('view cache', false);


// app.use('/api', require('./routes/api')); 
// app.use('/', require('./routes/web'));

// app.listen(PORT, () => {
//     console.log('Server running on port '.bgMagenta.white + PORT);

// });



const app = require("./app");

const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
    console.log('Server running on port '.bgMagenta.white + PORT);

});
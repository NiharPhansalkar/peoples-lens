const https = require('https');
const express = require('express'); // Backend framework to build RESTful API's with NodeJS
const bcrypt = require('bcrypt'); // Library to hash passwords
const session = require('express-session'); // To store variables in session
const bodyParser = require('body-parser'); // To parse form data
const fs = require('fs'); // To access the file system
const path = require('path'); // For functions like path.join/path.resolve
const { Pool } = require('pg'); // Connection to postgres
const nodemailer = require('nodemailer');

const port = 3000;

// Create an instance of express
const app = express();

// Options for https server
const options = {
    host: "localhost",
    port: port,
    path: "/",
    rejectUnauthorized: false,
    requestCert: true,
    agent: false,
    key: fs.readFileSync(
        path.join(path.resolve(__dirname, "../../"), "/certs/myLocalhost.key")
    ),
    cert: fs.readFileSync(
        path.join(path.resolve(__dirname, "../../"), "/certs/myLocalhost.crt")
    ),
    ca: fs.readFileSync(
        path.join(path.resolve(__dirname, "../../"), "/certs/myCA.pem")
    ),
};

// Middleware to server static files such as HTML, CSS, Images
// Define all paths absolute to root of project to serve
app.use(express.static(path.resolve(__dirname, "../")));

app.get('/', (req, res) => {
    res.redirect('/welcome.html');
});

app.get('/welcome.html', (req, res) => {
    res.sendFile(path.join(path.resolve(__dirname, '../')), 'index.html');
});

app.get('/login/userLogin.html', (req, res) => {
    res.sendFile(path.join(path.resolve(__dirname, '../')), '/login/userLogin.html')
});

// Starting https server
const server = https.createServer(options, app);
server.listen(port, () => {
    console.log("Server is listening on port " + port);
});

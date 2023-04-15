const https = require('https');
const express = require('express'); // Backend framework to build RESTful API's with NodeJS
const bcrypt = require('bcrypt'); // Library to hash passwords
const session = require('express-session'); // To store variables in session
const bodyParser = require('body-parser'); // To parse form data
const fs = require('fs'); // To access the file system
const path = require('path'); // For functions like path.join/path.resolve
const { Pool } = require('pg'); // Connection to postgres
const nodemailer = require('nodemailer');
const { promisify } = require('util');

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

app.get('/signUp/userSignUp.html', (req, res) => {
    res.sendFile(path.join(path.resolve(__dirname, '../')), '/signUp/userSignUp.html');
});

app.get('/user_information/userInfo.html', (req, res) => {
    res.sendFile(path.join(path.resolve(__dirname, '../')), '/user_information/userInfo.html');
});

app.get('/otp/userOTP.html', (req, res) => {
    res.sendFile(path.join(path.resolve(__dirname, '../')), '/otp/userOTP.html');
});

app.get('/user_image/userImage.html', (req, res) => {
    res.sendFile(path.join(path.resolve(__dirname, '../')), '/user_image/userImage.html');
});

app.get('/capture_person/capturePerson.html', (req, res) => {
    res.sendFile(path.join(path.resolve(__dirname, '../')), '/capture_person/capturePerson.html');
});

// Post method handling

app.use(bodyParser.urlencoded({ extended : true })); // Parse incoming request bodies in a middleware before your handlers, available under the req.body property

app.use(express.json());

app.use(session({
    secret: "otp-secret",
    resave: false,
    saveUninitialized: true
}));

app.post('/signUp/userSignUp.html', async (req, res) => {
    try {
        let newOtp = generateOTP();
        
        const hashPass = await bcrypt.hash(req.body['user-pswd'], 10);

        const boolPass = await bcrypt.compare(req.body['user-confirm-pswd'], hashPass);
        
        if (!boolPass) {
            res.redirect('/signUp/userSignUp.html?error=-1');
        } else {
            sendOTP(req.body['user-email'], newOtp);
            console.log(newOtp);

            req.session.hashPass = hashPass;
            req.session.email = req.body['user-email'];
            req.session.generatedOtp = newOtp;

            res.redirect('/otp/userOTP.html');
        }
    } catch (e) {
        console.log(e);
    }
});

app.post('/otp/userOTP.html', async (req, res) => {
    try {
        if (parseInt(req.body['user-otp']) === req.session.generatedOtp) {
            // Creating DB query
            let dbQuery = `
            INSERT INTO user_information(email, password)
            VALUES (
                '${req.session.email}',
                '${req.session.hashPass}'
            );`;

            const pool = createPool();

            const dbres = await pool.query(dbQuery);

            delete req.session.generatedOtp;
            delete req.session.hashPass;

            res.redirect('/user_information/userInfo.html');
        } else {
            res.redirect('/otp/userOTP.html?err=-1');
        }
    } catch (e) {
        console.log(e);
    }
});

app.post('/user_information/userInfo.html', async (req, res) => {
    try {
        const dbQuery = `
            UPDATE user_information
            SET name = $1, phone = $2, domain = $3, bio = $4 
            WHERE email = $5;
        `;
        const pool = createPool();

        const dbres = await pool.query(dbQuery, [req.body['user-name'], req.body['user-phone'], req.body['user-domain'], req.body['user-bio'], req.session.email]);
        
        req.session.name = req.body['user-name'];
        res.redirect('/capture_person/capturePerson.html');
    } catch (e) {
        console.log(e);
    }
});

app.post('/capture_person/capturePerson.html', async (req, res) => {
    const imageDataUrl = req.body.imageDataUrl; 
    const fileData = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(fileData, 'base64');
    const writeFile = promisify(fs.writeFile);
    
    const dbQuery = `
        SELECT id 
        FROM user_information
        WHERE email = $1;
    `;
    const pool = createPool();
    const dbres = await pool.query(dbQuery, [req.session.email]);

    const filePath = path.join(path.resolve(__dirname, "../"), 'face_images/', `${dbres.rows[0].id}.jpeg`);
    try {
        await writeFile(filePath, buffer);
        res.status(200).json({ success : true });
    } catch (err) {
        console.error('Error writing image file', err);
        res.status(500).json({ success: false, error: 'Error writing image file' });
    }
});

// Starting https server
const server = https.createServer(options, app);
server.listen(port, () => {
    console.log("Server is listening on port " + port);
});

function generateOTP() {
  const min = 100000;
  const max = 999999;
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function createPool() {
    return new Pool({
        database: "LensDB",
        port: 5432,
        user: "tigress",
        ssl: {
            rejectUnauthorized: false,
            key: fs
                .readFileSync(
                    path.join(
                        path.resolve(__dirname, "../../"),
                        "/certs/myLocalhost.key"
                    )
                )
                .toString(),
            cert: fs
                .readFileSync(
                    path.join(
                        path.resolve(__dirname, "../../"),
                        "/certs/myLocalhost.crt"
                    )
                )
                .toString(),
            ca: fs
                .readFileSync(
                    path.join(
                        path.resolve(__dirname, "../../"),
                        "/certs/myCA.pem"
                    )
                )
                .toString(),
        },
    });
}

async function sendOTP(userMail, userOTP) {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        secure: false,
        auth: {
            user: "digichit1@gmail.com",
            pass: "pdocouapfixqowjm",
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    let info = await transporter.sendMail({
        from: "People's Lens <peoples.lens.1@gmail.com>",
        to: `${userMail}`,
        subject: "Email Confirmation",
        html: `<p>Hello! Below is the OTP for your email confirmation! Thank you for registering to People's Lens!</p>
            <h2>${userOTP}</h2>`,
    });
}

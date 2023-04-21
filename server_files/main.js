const express = require('express'); // Backend framework to build RESTful API's with NodeJS
const bcrypt = require('bcrypt'); // Library to hash passwords
const session = require('express-session'); // To store variables in session
const bodyParser = require('body-parser'); // To parse form data
const fs = require('fs'); // To access the file system
const path = require('path'); // For functions like path.join/path.resolve
const { Pool } = require('pg'); // Connection to postgres
const nodemailer = require('nodemailer');
const { promisify } = require('util');
const url = require('url'); // To get url parameters
const axios = require('axios');
const FormData = require('form-data');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

let serviceAccount = require('../peopleslens-pbl-firebase-adminsdk-pohc3-6f89177c29.json');
let firebaseUser;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'gs://peopleslens-pbl.appspot.com'
});

const port = process.env.PORT || 3000;

// Create an instance of express
const app = express();

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

app.get('/capture_person/capturePerson.html', (req, res) => {
    res.sendFile(path.join(path.resolve(__dirname, '../')), '/capture_person/capturePerson.html');
});

app.get('/recognize_user/recognizeUser.html', (req, res) => {
    res.sendFile(path.join(path.resolve(__dirname, '../')), '/recognize_user/recognizeUser.html');
});

app.get('/display_information/displayInformation.html', (req, res) => {
    res.sendFile(path.join(path.resolve(__dirname, '../')), '/display_information/displayInformation.html');
});

app.get('/recognize_user/sendID', async (req, res) => {
    try {
        const pool = createPool();
        const result = await pool.query('SELECT id FROM user_information');
        if (result.rows.length === 0) {
            return res.json([]);
        }
        const ids = result.rows.map(row => row.id);
        res.json(ids);
    } catch (err) {
        console.error(err);
        res.json([]);
    }
});

app.get('/recognize_user/downloadLink', async (req, res) => {
    const label = req.query.label;
    const bucketName = 'peopleslens-pbl.appspot.com';
    const bucket = admin.storage().bucket();
    const fileName = `${label}.jpeg`;
    const file = bucket.file(fileName);

    try {
        const [metadata] = await file.getMetadata();
        const downloadUrl = metadata.mediaLink;
        let uid = uuidv4();
        let authToken = await makeAuthToken(uid);
        console.log(authToken);
        res.json({downloadUrl, authToken});
    } catch(error) {
        console.log(error);
    }
});

app.get('/recognize_user/sendInfo', async (req, res) => {
    try {
        const pool = createPool();
        const result = await pool.query('SELECT id, name, domain FROM user_information');
        if (result.rows.length === 0) {
            return res.json([]);
        }
        const returnVal = result.rows.map(row => {
            return {
                id: row.id,
                name: row.name,
                domain: row.domain,
            }
        });

        res.json(returnVal);
    } catch (error) {
        console.log(err);
        res.json([]);
    } 
});

// Post method handling

app.use(bodyParser.urlencoded({ extended : true })); // Parse incoming request bodies in a middleware before your handlers, available under the req.body property

app.use(express.json());

app.use(session({
    secret: "otp-secret",
    resave: false,
    saveUninitialized: true
}));

app.post('/login/userLogin.html', async (req, res) => {
    try {
        const pool = createPool();
        const dbQuery = `
            SELECT password FROM user_information
            WHERE email = $1;
        `;

        const dbres = await pool.query(dbQuery, [req.body['user-email']]);
        
        if (dbres.rows.length !== 0) {
            const boolPass = await bcrypt.compare(req.body['user-pswd'], dbres.rows[0].password); 

            if (boolPass) {
                // Correct credentials
                res.redirect('/recognize_user/recognizeUser.html');
            } else {
                // Incorrect password

                res.redirect('/login/userLogin.html?error=-1');
            }
        } else {
            // Not signed up
            
            res.redirect('/login/userLogin.html?error=-2');
        }
    } catch (err) {
        console.log(err);
    }
});

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
            res.redirect('/otp/userOTP.html?error=-1');
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
    //const writeFile = promisify(fs.writeFile);
    const bucket = admin.storage().bucket();
    
    const dbQuery = `
        SELECT id 
        FROM user_information
        WHERE email = $1;
    `;
    const pool = createPool();
    const dbres = await pool.query(dbQuery, [req.session.email]);

    //const dirPath = path.join(path.resolve(__dirname, "../"), '/recognize_user/labels/', `${dbres.rows[0].id}/`);
    //const filePath = path.join(dirPath, `${dbres.rows[0].id}.jpeg`);
    const fileName = `${dbres.rows[0].id}.jpeg`;
    const file = bucket.file(fileName);
    try {
        await file.save(buffer, {
            contentType: 'image/jpeg'
        });
        const [url] = await file.getSignedUrl();
        const newDbQuery = `
            UPDATE user_information
            SET imageURL = $1
            WHERE id = $2;
        `;
        const newDbRes = await pool.query(newDbQuery, [url, dbres.rows[0].id]);
        console.log('Image uploaded successfully!');
        res.status(200).json({ success : true });
    } catch (err) {
        console.error('Error uploading image file ', err);
        res.status(500).json({ success: false, error: 'Error writing image file' });
    }
});

app.post('/display_information/displayInformation.html', async (req, res) => {
    const id = req.query.label;    

    try {
        const dbQuery = `
            SELECT name, email, domain, bio, photoID
            FROM user_information
            WHERE id = $1;
        `;

        const pool = createPool();
        const dbres = await pool.query(dbQuery, [id]);

        const returnObj = {
            name: dbres.rows[0].name,
            email: dbres.rows[0].email,
            domain: dbres.rows[0].domain,
            bio: dbres.rows[0].bio,
            photoID: dbres.rows[0].photoID,
        };

        res.json(returnObj);
    } catch (err) {
        console.log(err);
    }
});

app.listen(port, () => {
    console.log("Listening on port " + port);
});

function generateOTP() {
  const min = 100000;
  const max = 999999;
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function createPool() {
    const conString = "postgresql://postgres:xhqSnn0hsjJPg3JTvUxc@containers-us-west-12.railway.app:5936/railway";
    return new Pool({
        connectionString: conString,
        database: "railway",
        port: 5936,
        user: "postgres",
        password: "xhqSnn0hsjJPg3JTvUxc",
        host: "containers-us-west-12.railway.app",
        ssl: {
            rejectUnauthorized: false
        }
    });
}

async function sendOTP(userMail, userOTP) {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        secure: false,
        auth: {
            user: "digichit1@gmail.com",
            pass: `${process.env.APP_PASSWORD}`,
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

    console.log("Email sent!!!");
}

async function makeAuthToken(uid) {
    try {
        const token = await admin.auth().createCustomToken(uid);
        return token;
    } catch (err) {
        console.log(err);
        return null;
    }
}

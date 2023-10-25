const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars')
const { body, validationResult } = require('express-validator');
const session = require('express-session');
// const routes = require('./routes'); // Import the routes module

const app = express();

const port = process.env.port || 3000;

const static_path = path.join(__dirname, "../public");
const viewsPath = path.join(__dirname, '../views');
const partialsPath = path.join(__dirname, '../views/partials')



//Database and necessary models
require("./db/conn");
const Register = require("./models/register");




/* Middleware */
// Setting up the view engine
//
app.engine('hbs', exphbs.engine ({
    extname: '.hbs',
    defaultLayout: false,
    partialsDir: partialsPath 
}));

app.set('views' , viewsPath );
app.set('view engine', 'hbs');

// Other middleware and configurations
app.use(express.static(static_path));
app.use(express.urlencoded({ extended: true })); 
app.use(express.json()); 
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized:true,
   // cookie:{ maxAge:60000}
}));



//routing
app.get("/", (req, res) => {
   res.render('index')
});

app.get("/login", (req, res) => {
   
    res.render('login');
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await Register.findOne({ email });

        if (!existingUser) {
            return res.status(400).render('login', { message: 'Invalid Email' });
        }

        if (existingUser.password !== password) {
            return res.status(400).render('login', { message: 'Invalid Password' });
        }
        req.session.user = existingUser;
        res.redirect('/userafterlogin?success');
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).send("Internal server error. Please try again later.");
    }
});

app.get("/register", (req, res) => {
   res.render('register')
});

app.post("/register", async (req, res) => {
    try {
        const { fullName, phoneNumber, email, password, confirmPassword } = req.body;
        const existingUserEmail = await Register.findOne({ email });
        const existingUserPhone = await Register.findOne({ phoneNumber });

        if (existingUserPhone || existingUserEmail) {
            return res.status(400).render('register', { message: 'Email or Phone Number already exists', formData: req.body});
        }


        const regNewUser = new Register({
            fullName: fullName,
            phoneNumber: phoneNumber,
            email: email,
            password: password,
            confirmPassword: confirmPassword
        });

        const registered = await regNewUser.save();
        return res.status(400).render('login', { message: 'Registration Successful'});
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).send("Internal server error. Please try again later.");
    }
});

app.get("/admin", (req, res) => {
   res.render('admin')
});

app.get('/userafterlogin', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const user = req.session.user;
    res.render('userafterlogin', { user: user });
});

app.get('/admindashboard', (req, res) =>{
    res.render('dashboard')
})
app.get("/vbook", (req, res) => {
   res.render('vbook')
});



app.get("/detail", (req, res) => {
   res.render('detail')
});



app.get("/privacy", (req, res) => {
   res.render('privacy')
});


app.get("/terms", (req, res) => {
   res.render('terms')
});


app.listen(port, () => {
   console.log(`Server is running at port: ${port}`)
});  
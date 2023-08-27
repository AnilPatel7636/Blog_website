
const express = require("express");
const path = require("path");

const bodyparser = require('body-parser');
const mongoose = require('mongoose');

const session = require('express-session');
const flash = require('express-flash');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const User = require('./models/user'); 
const Blog = require('./models/blog'); 

const app = express();
app.use(flash());
const port = 80;

app.use("/static", express.static("static"));
app.use(express.urlencoded());

var cons = require('consolidate');

// view engine setup
app.engine('html', cons.swig)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/goblogs');//"goblogs" is my local dbs name in mongosh
};

// Configure express-session middleware
app.use(session({
    secret: '124421', // Replace with a secret key for session encryption
    resave: false,
    saveUninitialized: false
}));

// Initialize passport and session
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport to use a local strategy for user authentication
passport.use(new LocalStrategy(
    { usernameField: 'email' }, // Use email as username
    async (email, password, done) => {
        try {
            const user = await User.findOne({ email });
            if (!user) {
                return done(null, false, { message: 'Incorrect email' });
            }
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return done(null, false, { message: 'Incorrect password' });
            }
            return done(null, user); // Authentication successful
        } catch (error) {
            return done(error);
        }
    }
));

// Serialize and deserialize user for session management
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

// Signup route
app.post('/signup', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });
        await newUser.save();
        req.flash('success', 'Successfully signed up!');
        res.redirect('/login'); // Redirect to login page after signup
    } catch (error) {
        console.error(error);
        res.status(500).send('Error signing up');
    }
});

// Login route
app.post('/login', passport.authenticate('local', {
    successRedirect: '/welcome',
    failureRedirect: '/login',
    failureFlash: true
}));




app.get('/welcome', (req, res) => {
    Blog.find({}).then(blogs => {
        res.render('welcome', { blogs }); // Render the welcome page with blog data
    }).catch(err => {
        console.error(err);
    });
});

app.get('/blog/:id', (req, res) => {
  const blogId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return res.status(400).send('Invalid blog ID');
  }
  Blog.findById(blogId)
    .then(blog => {
      if (!blog) {
        return res.status(404).send('Blog not found');
      }
      res.render('blog', { blog }); // Render the individual blog page
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error fetching blog');
    });
});

app.post('/create', (req, res) => {
    const newBlog = new Blog({
        title: req.body.title,
        body: req.body.body,
        author: req.user._id // Assuming you have user data in the session
    });
    newBlog.save()
        .then(() => {
            res.redirect('/welcome');
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Error signing up');
        });

});


app.get('/', (req, res) => {
    const params = {}
    res.status(200).render("home.html", params);
});


app.get('/help', (req, res) => {
    const params = {}
    res.status(200).render("help.html", params);
});

app.get('/login', (req, res) => {
    const params = {}
    res.status(200).render("login.html", params);
});

app.get('/welcome', (req, res) => {
    const params = {}
    res.status(200).render("welcome.html", params);
});

app.get('/create', (req, res) => {
    const params = {}
    res.status(200).render("create.html", params);
});

app.get('/signup', (req, res) => {
    const params = {}
    res.status(200).render("signup.html", params);
});


app.listen(port, () => {
    console.log(`app started successfully on port ${port}`)
});
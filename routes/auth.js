const express = require('express')
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { validateLogIn, validateSingIn } =  require('../middlewares/users_validation')
const auth = require("../middlewares/auth");
require('dotenv').config();

router.post('/register', validateSingIn, async (req, res, next) => {
    try {

        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(409).json({ message: "Email already registered!" });
        };
        
        const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
        });
        await newUser.save();

        res.status(201).json({
            user: {
                name: newUser.name,
                email: newUser.email,
            }
        });        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post('/login', validateLogIn, async (req, res, next) => {
    try {
        const { email, password} = req.body;

        const user = await User.findOne({ email });
         if (!user) {
            console.error("User not found with email:", email);
            return res.status(401).json({ message: 'Email or password is wrong' });
        }

        const isPasswordValid = await user.isValidPassword(password);

        if (!isPasswordValid) {
            console.error("Invalid password for user:", password);
            return res.status(401).json({ message: 'Email or password is wrong' });
        }

        const payload = { id: user._id };
        console.log("Payload for JWT:", payload);

        const token = jwt.sign(payload, process.env.SECRET, { expiresIn: '3h' });
        user.token = token;
        await user.save();

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                name: user.name,
                email: user.email,
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.get('/current', auth, async (req, res) => {
    const { name } = req.user;
    res.json({
        user: {
            name,
        }
    });
});

router.get('/logout',auth, async (req, res) => {
    try {
        //  req.user este obiectul utilizatorului autentificat
        const user = req.user;
        // Resetăm tokenul
        user.token = null;
         // Salvăm schimbările în baza de date
        await user.save();
        res.status(200).json({ message: 'Successfully logged out' });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


module.exports = router;


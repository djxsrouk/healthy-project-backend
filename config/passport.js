const passport = require("passport");
const passportJWT = require("passport-jwt");
const User = require("../models/user");
require("dotenv").config();
const mongoose = require('mongoose');

const ExtractJWT = passportJWT.ExtractJwt;
const Strategy = passportJWT.Strategy;
const secret = process.env.SECRET;

const params = {
    secretOrKey: secret,
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
};
module.exports = passport => {
    passport.use(
        new Strategy(params, async (payload, done) => {
            try {
                const user = await User.findById(payload.id);
                if (!user) {
                    console.log("User not found");
                    return done(null, false);
                }
                console.log("User found:", user);
                return done(null, user);
            } catch (err) {
                console.error("Error during JWT authentication:", err);
                return done(err, false);
            }
        })
    );
};

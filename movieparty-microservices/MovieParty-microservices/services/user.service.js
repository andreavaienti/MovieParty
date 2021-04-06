"use strict";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
// DB Config
const dbUsers = require("../configDB/userDBKeys").mongoURI; 

// Load User model
const User = require("../models/User");

// Load input validation
const validateRegisterInput = require("../utility/validation/register");
const validateLoginInput = require("../utility/validation/login");

module.exports = {
	name: "user",

	/**
	 * Settings
	 */
	settings: {

	},

	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {

        /**
         *  Register a new user.
         */
        register: {
			rest: {
				method: "POST",
				path: "/register",
                params: {
					name : "string",
                    email: "string",
                    password: "string",
                    password2: "string"
				}
			},
			async handler(ctx) {
                // Form validation
                const { errors, isValid } = validateRegisterInput(ctx.params);

                // Check validation
                if (!isValid) {
                    ctx.meta.$statusCode = 400;
                    return errors;
                }
              
                return await User.findOne({ name: ctx.params.name }).then(usr => {
                    if (usr) {
                        ctx.meta.$statusCode = 400;
                        return 'name: "Username already exists"';            
                    }else{
                        return User.findOne({ email: ctx.params.email }).then(user => {
                            if (user) {
                                ctx.meta.$statusCode = 400;
                                return 'email: "Email already exists"';
                            } else {
                                const newUser = new User({
                                    name: ctx.params.name,
                                    email: ctx.params.email,
                                    password: ctx.params.password
                                });
            
                                ctx.emit("friend.newuser", ctx.params.name);
                    
                                //Hash password before saving in database
                                bcrypt.genSalt(10, (err, salt) => {
                                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                                    if (err) throw err;
                                    newUser.password = hash;
                                    newUser.save()
                                        .then()
                                        .catch(err => console.log(err));                                    
                                    });
                                });
                            }
                        });
                    }
                });
			}
		}, 

        login: {
			rest: {
				method: "POST",
				path: "/login",
                params: {
                    email: "string",
                    password: "string" 
				}
			},
            async handler(ctx) {

                // Form validation
                const { errors, isValid } = validateLoginInput(ctx.params);
            
                // Check validation
                if (!isValid) {
                    ctx.meta.$statusCode = 400;
                    return errors;
                }

                const email = ctx.params.email;
                const password = ctx.params.password;
            
                // Find user by email
                User.findOne({ email }).then(user => {
                    // Check if user exists
                    if (!user) {
                        ctx.meta.$statusCode = 400;
                        return 'emailnotfound: "Email not found"';
                    }
                
                    // Check password
                    bcrypt.compare(password, user.password).then(isMatch => {
                        if (isMatch) {
                            // User matched
                            // Create JWT Payload
                            const payload = {
                                id: user.id,
                                name: user.name
                            };
                            
                            var tokenTMP = "";
                            // Sign token
                            jwt.sign(payload, keys.secretOrKey, {
                                expiresIn: 31556926 // 1 year in seconds
                                },(err, token) => {
                                    //DA RIGUARDARE
                                    /*res.json({
                                        success: true,
                                        token: "Bearer " + token
                                    });*/
                                    tokenTMP = token;
                                }
                            );

                            user.online = true
                            user.save()

                            return 'success: true, token: "Bearer "' + tokenTMP;

                        } else {
                            ctx.meta.$statusCode = 400;
                            return 'passwordincorrect: "Password incorrect"';
                        }
                    });
                });

            }
        }, 

        logout: {
			rest: {
				method: "PUT",
				path: "/logout",
				params: {
					name : "string"
				}
			},
			async handler(ctx) {
                myUsername = ctx.params.name;
                User.findOne({ name: myUsername }).then(user => {
                    user.online = false;
                    user.save();
                    return;
                });
			}
		},

        /*async isPresent(ctx) {
            console.log(ctx.params)
            return await User.findOne({ name: ctx.params.name }).then(user => { 
                return !user? false : true;
            });    
        }*/
	},

	/**
	 * Events
	 */
	events: {

	},

	/**
	 * Methods
	 */
	methods: {

	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {

	},

	/**
	 * Service started lifecycle event handler
	 */
	async started() {

	},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {

	}
};
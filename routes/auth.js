const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {registerValidation, loginValidation} = require('../validation');

router.post('/register', (req, res) => {

    //validate
    const {error} = registerValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    //check if user exists
    User.findOne({email: req.body.email})
        .then(emailExist => {
            if(emailExist) {
                //if user already exists, die
                return res.status(400).send('Email already exists');
            } else {
                //otherwise keep going and make new user
                const user = new User({
                    name: req.body.name,
                    email: req.body.email,
                    password: req.body.password
                });
                //generate salt and salt the hash
                bcrypt.genSalt(10)
                    .then(salt => {
                        bcrypt.hash(user.password, salt)
                            .then(hash => {
                                //save the hashed password
                                user.password = hash;
                                user.save()
                                    .then(() => {
                                        res.send({user: user._id});
                                    }).catch(err => {
                                        res.status(400).json(`Error: ${err}`);
                                    })
                            })
                    });
            }
        });
});

router.post('/login', (req, res) => {
    const {error} = loginValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    User.findOne({email: req.body.email})
        .then(user => {
            if(!user) {
                return res.status(400).json({emailnotfound : "Email not found"});
            }
            bcrypt.compare(req.body.password, user.password)
                .then(isMatch => {
                    if(!isMatch) {
                        return res.status(400).json({invalidPass: "Invalid Password"});
                    }
                    //Create and assign a token
                    const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);
                    res.header('auth-token', token).json(token);
                    
                }); 
        });
        
});


module.exports = router;
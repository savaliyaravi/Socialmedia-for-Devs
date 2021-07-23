const express =  require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const gravatar = require('gravatar');
const User = require('../../models/Users');
const normalize = require('normalize-url');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require("config");

// @route  POST api/users
// @desc   Test Route
// @access Public

router.post('/', [
    check('name', 'Name is Required').not().isEmpty(),
    check('email', 'Please include a valid emmail').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({min: 6})
],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }


    try {
        
    const { name, email, password } = req.body;
    let user = await User.findOne({email});
    
    if(user) {
        res.send(400).json({ errors: errors.array() });
    }

    const avatar = normalize(
        gravatar.url(email, {
          s: '200',
          r: 'pg',
          d: 'mm'
        }),
        { forceHttps: true }
      );

    user = new User({
        name, 
        email,
        avatar,
        password
    });

    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
        user: {
            id: user.id,
        }
    }

    jwt.sign (
        payload,
        config.get('jwtToken'),
        { expiresIn: 36000 },
        (err, token) => {
            if(err) {
                console.log(err);
                res.sendStatus(500);
                return;
            } else {
                res.json({ token });
            }

        }
    );

 
    // res.send("User Created");
    } catch(err) {
        console.error(err.message);
        res.status(500).json("Server Error");
    }
    
});



module.exports = router;
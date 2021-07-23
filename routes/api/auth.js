const express =  require("express");
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/Users');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const config = require("config");

// @route  GET api/auth
// @desc   Test Route
// @access Public

router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route  POST api/auth
// @desc   Auth user and get token
// @access Public

router.post('/', [
    check('email', 'Please include a valid emmail').isEmail(),
    check('password', 'password is required').exists()
],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }


    try {   
    const { email, password } = req.body;
    let user = await User.findOne({email});
    
    if(!user) { 
        return res
        .status(400)
        .json({ errors: [{ msg: "Invalid Credentials" }] });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch) {
        return res
        .status(400)
        .json({ errors: [{ msg: "Invalid Credentials" }] });
    }

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
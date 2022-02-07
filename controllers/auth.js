const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

const JWTSecret = require('../constants').JWTSecret;

const setDefaultErrorCode = (err, next) => {
  if (!err.statusCode) {
    err.statusCode = 500;
  }

  next(err);
};

exports.signup = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error('Validation failed!');
    error.statusCode = 422;
    error.data = errors.array();

    throw error;
  }

  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;

  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email,
        name,
        password: hashedPassword,
      });

      return user.save();
    })
    .then((createdUser) => {
      return res.status(201).json({
        message: 'User created successfully.',
        userId: createdUser._id,
      });
    })
    .catch((err) => setDefaultErrorCode(err, next));
};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;

  User.findOne({ email: email })
    .then((userDoc) => {
      if (!userDoc) {
        const error = new Error('No user found.');
        error.statusCode = 401;

        throw error;
      }

      loadedUser = userDoc;

      return bcrypt.compare(password, userDoc.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error('Invalid password.');
        error.statusCode = 401;

        throw error;
      }

      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        JWTSecret,
        { expiresIn: '1h' }
      );

      res.status(200).json({
        token,
        userId: loadedUser._id.toString(),
      });
    })
    .catch((err) => setDefaultErrorCode(err, next));
};

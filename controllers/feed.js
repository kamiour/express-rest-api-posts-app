const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator');

const Post = require('../models/post');

const setDefaultErrorCode = (err, next) => {
  if (!err.statusCode) {
    err.statusCode = 500;
  }

  next(err);
};

const clearImage = (filePath) => {
  constructedPath = path.join(__dirname, '..', filePath);
  fs.unlink(constructedPath, (err) => console.log(err));
};

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems = 0;

  Post.find()
    .countDocuments()
    .then((totalCount) => {
      totalItems = totalCount;

      return Post.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    })
    .then((posts) => {
      return res.status(200).json({
        message: 'Posts fetched',
        posts,
        totalItems,
      });
    })
    .catch((err) => {
      setDefaultErrorCode(err, next);
    });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error('Validation failed!');
    error.statusCode = 422;

    throw error;
  }

  if (!req.file) {
    const error = new Error('No image added!');
    error.statusCode = 422;

    throw error;
  }

  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.file.path.replace('\\', '/');

  const post = new Post({
    title,
    content,
    imageUrl,
    creator: {
      name: 'User name',
    },
  });

  post
    .save()
    .then((result) => {
      return res.status(201).json({
        message: 'Post created successfully',
        post: result,
      });
    })
    .catch((err) => {
      setDefaultErrorCode(err, next);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error('Post not found');
        error.statusCode = 404;

        throw error;
      }

      return res.status(200).json({
        message: 'Post fetched.',
        post,
      });
    })
    .catch((err) => {
      setDefaultErrorCode(err, next);
    });
};

exports.updatePost = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error('Validation failed!');
    error.statusCode = 422;

    throw error;
  }

  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;

  if (req.file) {
    imageUrl = req.file.path.replace('\\', '/');
  }

  if (!imageUrl) {
    const error = new Error('No image provided.');
    error.statusCode = 422;

    throw error;
  }

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error('Post not found');
        error.statusCode = 404;

        throw error;
      }

      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }

      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;

      return post.save();
    })
    .then((result) => {
      return res.status(200).json({
        message: 'Post updated successfully.',
        post: result,
      });
    })
    .catch((err) => {
      setDefaultErrorCode(err, next);
    });
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error('Post not found');
        error.statusCode = 404;

        throw error;
      }

      // Check logged in user

      clearImage(post.imageUrl);

      return Post.findByIdAndRemove(postId);
    })
    .then(() => {
      return res.status(200).json({
        message: 'Post deleted.',
      });
    })
    .catch((err) => {
      setDefaultErrorCode(err, next);
    });
};

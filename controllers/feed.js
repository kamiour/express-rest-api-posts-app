const { validationResult } = require('express-validator');

exports.getPosts = (req, res, next) => {
  return res.status(200).json({
    posts: [
      {
        _id: 'some_id',
        title: 'First post',
        content: 'This is first post',
        imageUrl: 'images/boat.jpg',
        creator: {
          name: 'Some name',
        },
        createdAt: new Date(),
      },
    ],
  });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed!', errors: errors.array() });
  }

  const title = req.body.title;
  const content = req.body.content;

  // create post in db
  return res.status(201).json({
    message: 'Post created successfully',
    post: {
      _id: new Date().toISOString(),
      title,
      content,
      creator: {
        name: 'User name',
      },
      createdAt: new Date(),
    },
  });
};

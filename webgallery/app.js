/* jshint esversion: 6 */

(function() {
  "use strict";

  const fs = require('fs');
  const path = require('path');
  const express = require('express');
  const session = require('express-session');
  const multer = require('multer');
  const bodyParser = require('body-parser');
  const nedb = require('nedb');
  const http = require('http');
  const cookie = require('cookie');
  const crypto = require('crypto');
  
  const upload = multer({ dest: 'uploads/' });
  const app = express();
  
  const PORT = 3000;
  
  const images = new nedb({ filename: './db/images.db', autoload: true, timestampData: true });
  const comments = new nedb({ filename: './db/comments.db', autoload: true, timestampData: true });
  const users = new nedb({ filename: './db/users.db', autoload: true });
  
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(express.static('frontend'));

  app.use(session({
    secret: 'rakinnikar',
    resave: false,
    saveUninitialized: true,
  }));

  app.use((req, res, next) => {
    req.username = ('username' in req.session) ? req.session.username : null;
    next();
  });

  const isAuthenticated = (req, res, next) => {
    if (!req.username) return res.status(401).end('access denied');
    next();
  };

  // signup a new user
  app.post('/api/signup/', (req, res) => {
    const { username, password } = req.body;
    const salt = crypto.randomBytes(16).toString('base64');
    const hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    const saltedHash = hash.digest('base64');

    users.findOne({ _id: username }, (err, user) => {
      if (err) return res.status(500).end(err);
      if (user) return res.status(409).end(`username ${username} already exists`);
      users.update({ _id: username },{ _id: username, password: saltedHash, salt }, { upsert: true }, err => {
          if (err) return res.status(500).end(err);
          // initialize cookie
          res.setHeader('Set-Cookie', cookie.serialize('username', username, {
            path : '/', 
            maxAge: 60 * 60 * 24 * 7
          }));
          return res.json(`user ${username} signed up`);
      });
    });
  });

  // sign in
  app.post('/api/signin/', (req, res) => {
    const { username, password } = req.body;
    
    // retrieve user from the database
    users.findOne({ _id: username }, (err, user) => {
      if (err) return res.status(500).end(err);
      if (!user) return res.status(401).end('access denied');

      const hash = crypto.createHmac('sha512', user.salt);
      hash.update(password);
      const saltedHash = hash.digest('base64');

      if (user.password !== saltedHash) return res.status(401).end('access denied');
      req.session.username = username;
      // initialize cookie
      res.setHeader('Set-Cookie', cookie.serialize('username', username, {
        path : '/', 
        maxAge: 60 * 60 * 24 * 7
      }));
      return res.json(`user ${username} signed in`);
    });
  });

  // sign out
  app.get('/api/signout/', isAuthenticated, (req, res) => {
    res.setHeader('Set-Cookie', cookie.serialize('username', '', {
      path : '/', 
      maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
    }));
    req.session.destroy();
    res.status(200).json('successfully logged out');
  });

  // get all users
  app.get('/api/users/', (req, res) => {
    users.find({}, {}, (err, users) => {
      if (err) return res.status(500).end(err);
      return res.json(users);
    });
  });

  // create image
  app.post('/api/images/', isAuthenticated, upload.single('image'), (req, res) => {
    const { file } = req;
    const { title, author } = req.body;
  
    if (!title || !author || !file) return res.status(400).end(`Missing required parameters`);
  
    const image = {
      title,
      author,
      imageData: file,
    };
  
    images.insert(image, (err, doc) => {
      if (err) return res.status(500).end(err.message || 'Internal Server Error');
      return res.status(201).json(doc);
    });
  });
  
  // create comment for image
  app.post('/api/images/:image_id/comments/', isAuthenticated, (req, res) => {
    const { image_id } = req.params;
    const { author, content } = req.body;
    const comment = {
      image_id,
      author,
      content
    };
  
    comments.insert(comment, (err, doc) => {
      if (err) return res.status(500).end(err.message || 'Internal Server Error');
      return res.status(201).json(doc);
    });
  });
  
  // read all images
  app.get('/api/images/', isAuthenticated, (_, res) => {
    images.find({}).sort({ createdAt: -1 }).exec((err, docs) => {
      if (err) return res.status(500).end(err.message || 'Internal Server Error');
      return res.json(docs);
    });
  });

  // read all images from a user
  app.get('/api/images/user/:user_id/', isAuthenticated, (req, res) => {
    const { user_id } = req.params;

    images.find({ author: user_id }).sort({ createdAt: -1 }).exec((err, docs) => {
      if (err) return res.status(500).end(err.message || 'Internal Server Error');
      return res.json(docs);
    });
  });
  
  // read specific image
  app.get('/api/images/:image_id/', isAuthenticated, (req, res) => {
    const { image_id } = req.params;
  
    images.findOne({ _id: image_id }, (err, doc) => {
      if (err) return res.status(500).end(err.message || 'Internal Server Error');
      else if (!doc) return res.status(404).end(`Image with id "${image_id}" could not be found.`);
      return res.json(doc);
    });
  });
  
  // get the raw image content
  app.get('/api/images/:image_id/image', isAuthenticated, (req, res) => {
    const { image_id } = req.params;

    images.findOne({ _id: image_id }, (err, doc) => {
      if (err) return res.status(500).end(err.message || 'Internal Server Error');
      else if (!doc) return res.status(404).end(`Image with id "${image_id}" could not be found.`);
      res.setHeader('content-type', doc.imageData.mimetype);
      res.sendFile(path.join(__dirname, doc.imageData.path));
    });
  });
  
  // get image's comments
  app.get('/api/images/:image_id/comments/', isAuthenticated, (req, res) => {
    const { image_id } = req.params;
    const { page } = req.query;
  
    comments.find({ image_id })
      .sort({ createdAt: -1 })
      .skip(page * 10)
      .limit(10)
      .exec((err, docs) => {
        if (err) return res.status(500).end(err.message || 'Internal Server Error');
        return res.json(docs);
    });
  });
  
  // delete image
  app.delete('/api/images/:image_id/', isAuthenticated, (req, res) => {
    const { image_id } = req.params;
  
    images.findOne({ _id: image_id }, (err, doc) => {
      if (err) return res.status(500).end(err.message || 'Internal Server Error');
      else if (!doc) return res.status(404).end(`Image with id "${image_id}" could not be found.`);
      else if (doc.author !== req.username) return res.status(401).end('access denied');
  
      // remove the file from storage
      fs.unlink(path.join(__dirname, doc.imageData.path), (err) => {
        if (err) return res.status(500).end(err.message || 'Internal Server Error');
  
        images.remove({ _id: image_id }, {}, (err, numRemoved) => {
          if (err) return res.status(500).end(err.message || 'Internal Server Error');
          else if (numRemoved <= 0) return res.status(404).end(`Image with id "${image_id}" could not be found.`);
          
          // cascading delete on image's comments
          comments.remove({ image_id }, { multi: true }, (err) => {
            if (err) return res.status(500).end(err.message || 'Internal Server Error');
            return res.json(doc);
          });
        });
      });
    });
  });
  
  // delete comment
  app.delete('/api/comments/:comment_id/', isAuthenticated, (req, res) => {
    const { comment_id } = req.params;
  
    comments.findOne({ _id: comment_id }, (err, doc) => {
      if (err) return res.status(500).end(err.message || 'Internal Server Error');
      else if (!doc) return res.status(404).end(`Comment with id "${comment_id}" could not be found.`);
      else if (doc.author !== req.username) return res.status(401).end('access denied');
  
      comments.remove({ _id: comment_id }, {}, (err, numRemoved) => {
        if (err) return res.status(500).end(err.message || 'Internal Server Error');
        else if (numRemoved <= 0) return res.status(404).end(`Comment with id "${comment_id}" could not be found.`);
        return res.json(doc);
      });
    });
  });
  
  // fallback route
  app.use((req, res) => {
    res.status(404).send(`Requested URL "${req.url}" was not found.`);
  });
  
  // start HTTP server
  http.createServer(app).listen(PORT, function (err) {
    if (err) console.error(err);
  });  
}());

/* jshint esversion: 6 */

(function() {
  "use strict";

  const fs = require('fs');
  const path = require('path');
  const express = require('express');
  const multer = require('multer');
  const bodyParser = require('body-parser');
  const nedb = require('nedb');
  const http = require('http');
  
  const upload = multer({ dest: 'uploads/' });
  const app = express();
  
  const PORT = 3000;
  
  const images = new nedb({ filename: './db/images.db', autoload: true, timestampData: true });
  const comments = new nedb({ filename: './db/comments.db', autoload: true, timestampData: true });
  
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(express.static('frontend'));
  
  // create image
  app.post('/api/images/', upload.single('image'), (req, res) => {
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
  app.post('/api/images/:image_id/comments/', (req, res) => {
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
  app.get('/api/images/', (_, res) => {
    images.find({}).sort({ createdAt: -1 }).exec((err, docs) => {
      if (err) return res.status(500).end(err.message || 'Internal Server Error');
      return res.json(docs);
    });
  });
  
  // read specific image
  app.get('/api/images/:image_id/', (req, res) => {
    const { image_id } = req.params;
  
    images.findOne({ _id: image_id }, (err, doc) => {
      if (err) return res.status(500).end(err.message || 'Internal Server Error');
      else if (!doc) return res.status(404).end(`Image with id "${image_id}" could not be found.`);
      return res.json(doc);
    });
  });
  
  // get the raw image content
  app.get('/api/images/:image_id/image', (req, res) => {
    const { image_id } = req.params;

    images.findOne({ _id: image_id }, (err, doc) => {
      if (err) return res.status(500).end(err.message || 'Internal Server Error');
      else if (!doc) return res.status(404).end(`Image with id "${image_id}" could not be found.`);
      res.setHeader('content-type', doc.imageData.mimetype);
      res.sendFile(path.join(__dirname, doc.imageData.path));
    });
  });
  
  // get image's comments
  app.get('/api/images/:image_id/comments/', (req, res) => {
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
  app.delete('/api/images/:image_id/', (req, res) => {
    const { image_id } = req.params;
  
    images.findOne({ _id: image_id }, (err, doc) => {
      if (err) return res.status(500).end(err.message || 'Internal Server Error');
      else if (!doc) return res.status(404).end(`Image with id "${image_id}" could not be found.`);
  
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
  app.delete('/api/comments/:comment_id/', (req, res) => {
    const { comment_id } = req.params;
  
    comments.findOne({ _id: comment_id }, (err, doc) => {
      if (err) return res.status(500).end(err.message || 'Internal Server Error');
      else if (!doc) return res.status(404).end(`Comment with id "${comment_id}" could not be found.`);
  
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

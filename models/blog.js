// /models/blog.js

const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: String,
  body: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Reference to the User model
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;

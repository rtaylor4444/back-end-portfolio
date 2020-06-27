const mongoose = require("mongoose");

const stringObj = {
  type: String,
  required: true,
  minlength: 3,
  maxlength: 128,
};
const uniqueStringObj = {
  type: String,
  required: true,
  minlength: 3,
  maxlength: 128,
  unique: true,
};
const blogContentSchema = new mongoose.Schema({
  contentType: Number,
  data: { type: [String] },
  imageData: { type: Buffer },
});
const blogSchema = new mongoose.Schema({
  author: stringObj,
  category: uniqueStringObj,
  date: { type: Date },
  content: { type: [blogContentSchema] },
});

const BlogContent = mongoose.model("BlogContent", blogContentSchema);
const Blog = mongoose.model("Blog", blogSchema);

module.exports.Blog = Blog;
module.exports.BlogContent = BlogContent;

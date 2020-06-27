const router = require("express").Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const { Blog, BlogContent } = require("../mongoose_models/blog");

createBlogContent = (blogContent) => {
  const contentArray = [];
  blogContent.forEach((c) => {
    contentArray.push({
      contentType: c.contentType,
      data: c.data,
      imageData: c.imageData,
    });
  });
  return contentArray;
};
validateBlog = (blogContent) => {
  if (!blogContent) return false;
  //The contentType should ALWAYS be a title
  if (blogContent[0].contentType !== 0) return false;
  return true;
};

//POST requests
router.post("/", [auth, admin], async function (req, res) {
  const content = createBlogContent(req.body.content);
  if (!validateBlog(content))
    return res.status(400).send("Your blog MUST start with a title");

  //Check and see if a blog with that category exists
  const isDuplicate = await Blog.findOne({ category: req.body.category });
  if (isDuplicate)
    return res.status(400).send("Your blog cannot have a duplicate category!");

  const date = req.body.date ? req.body.date : Date.now();
  const blog = new Blog({
    author: req.user.name,
    category: req.body.category,
    date,
    content,
  });
  await blog.save();
  res.send(blog);
});

//GET requests
router.get("/", async function (req, res) {
  //Return our blogs in date order (newest to oldest)
  const blogs = await Blog.find().sort({ date: -1 });
  res.send(blogs);
});

router.get("/:id", async function (req, res) {
  const blog = await Blog.findById(req.params.id);
  if (!blog)
    return res.status(404).send("The blog with the given id was not found");
  res.send(blog);
});

//PUT requests
router.put("/:id", [auth, admin], async function (req, res) {
  const content = createBlogContent(req.body.content);
  if (!validateBlog(content))
    return res.status(400).send("Your blog MUST start with a title");

  const blog = await Blog.findById(req.params.id);
  if (!blog)
    return res.status(404).send("The blog with the given id was not found");

  blog.category = req.body.category;
  blog.content = content;
  await blog.save();

  res.send(blog);
});

//DELETE requests - TODO later (do not want to delete blogs just yet; edit instead)
router.post("/", [auth, admin], async function (req, res) {});

module.exports = router;

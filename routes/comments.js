const router = require("express").Router();
const _ = require("lodash");
const {
  Reply,
  createModel,
  updateComment,
  updateReply,
} = require("../mongoose_models/comment");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

//POST requests
//Parent Comment
router.post("/:name", auth, async function (req, res) {
  const comment = await verifyComment(createModel(req.params.name), req);
  await comment.save();
  res.send(comment);
});
//Replies
router.post("/:name/:id", auth, async function (req, res) {
  const reply = await verifyReply(req);
  const comment = await createModel(req.params.name).findById(req.params.id);
  if (!comment)
    return res.status(404).send("The comment with the given id was not found");
  comment.replies.push(reply);
  await comment.save();
  res.send(reply);
});

//GET requests
router.get("/:name", async function (req, res) {
  const comments = await createModel(req.params.name).find();
  res.send(comments);
});

//PUT requests
//Parent Comment
router.put("/:name", auth, async function (req, res) {
  const Comment = createModel(req.params.name);
  req.body.author = req.user.name;
  const commentToEdit = await Comment.findOne(
    _.pick(req.body, ["_id", "author"])
  );
  //If comment doesnt exist assume the user is trying to edit a comment
  //that is not thiers
  if (!commentToEdit) return res.status(401).send("Access denied");
  const newComment = await verifyComment(Comment, req);
  newComment.isEdited = true;

  updateComment(commentToEdit, newComment);
  await commentToEdit.save();
  res.send(commentToEdit);
});
//Replies
router.put("/:name/:id", auth, async function (req, res) {
  const newReply = await verifyReply(req);
  const Comment = createModel(req.params.name);
  const commentToEdit = await Comment.findById(req.params.id);
  if (!commentToEdit)
    return res.status(404).send("The comment with the given id was not found");
  const oldReply = commentToEdit.replies.id(req.body._id);
  if (!oldReply)
    return res.status(404).send("The reply with the given id was not found");
  newReply.isEdited = true;
  updateReply(oldReply, newReply);
  await commentToEdit.save();
  res.send(oldReply);
});

//DELETE requests
//Parent Comment
router.delete("/:name", [auth, admin], async function (req, res) {
  const commentToDelete = await createModel(req.params.name).findByIdAndRemove(
    req.body._id
  );
  if (!commentToDelete)
    return res.status(404).send("The comment with the given id was not found");
  res.send(commentToDelete);
});
//Replies
router.delete("/:name/:id", [auth, admin], async function (req, res) {
  const comment = await createModel(req.params.name).findById(req.params.id);
  if (!comment)
    return res.status(404).send("The comment with the given id was not found");
  const reply = comment.replies.id(req.body._id);
  if (!reply)
    return res.status(404).send("The reply with the given id was not found");
  reply.remove();
  comment.save();
  res.send(comment);
});

//Helper functions
async function verifyReply(req) {
  const reply = new Reply(_.pick(req.body, ["author", "message", "isAdmin"]));
  await reply.validate();
  //Ensure user doesnt put invalid info such as name or admin
  return updateReply(reply, {
    author: req.user.name,
    isAdmin: req.user.isAdmin,
  });
}
async function verifyComment(Comment, req) {
  const comment = new Comment(
    _.pick(req.body, ["author", "message", "isAdmin", "replies"])
  );
  await comment.validate();
  //Ensure user doesnt put invalid info such as name or admin
  return updateComment(comment, {
    author: req.user.name,
    isAdmin: req.user.isAdmin,
  });
}
module.exports = router;

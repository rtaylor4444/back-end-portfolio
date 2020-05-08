const mongoose = require("mongoose");

const authorObj = {
  type: String,
  required: true,
  minlength: 3,
  maxlength: 50,
};
const messageObj = { type: String, required: true, maxlength: 255 };
const adminObj = { type: Boolean, default: false, required: true };
const dataObj = { type: Date, default: Date.now() };
const editedObj = { type: Boolean, default: false };

const replySchema = new mongoose.Schema({
  author: authorObj,
  message: messageObj,
  isAdmin: adminObj,
  isEdited: editedObj,
  date: dataObj,
});
const commentSchema = new mongoose.Schema({
  author: authorObj,
  message: messageObj,
  isAdmin: adminObj,
  isEdited: editedObj,
  date: dataObj,
  replies: { type: [replySchema] },
});

const Reply = mongoose.model("Reply", replySchema);
//Used to create different collections for each project, blog or whatever
function createModel(itemName) {
  return mongoose.model(itemName, commentSchema);
}

//Helper functions
function updateReply(reply, obj) {
  //Check if properties exist and set them properly in one place
  if (obj.author) reply.author = obj.author;
  if (obj.message) reply.message = obj.message;
  if (obj.isAdmin) reply.isAdmin = obj.isAdmin;
  if (obj.isEdited) reply.isEdited = obj.isEdited;
  return reply;
}
function updateComment(comment, obj) {
  comment = updateReply(comment, obj);
  if (obj.replies && obj.replies.length > 0) comment.replies = obj.replies;
  return comment;
}
module.exports.createModel = createModel;
module.exports.updateComment = updateComment;
module.exports.updateReply = updateReply;
module.exports.Reply = Reply;

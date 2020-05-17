const { User } = require("../../mongoose_models/user");
const { Reply, createModel } = require("../../mongoose_models/comment");
const request = require("supertest");
const mongoose = require("mongoose");
let server;

describe("/api/comments", () => {
  let Comment = createModel("test");
  let token;
  let comment;
  let commentUpdates;
  let reply;
  let replyUpdates;
  let connectionString;

  function postComment() {
    return request(server)
      .post("/api/comments/test")
      .set("x-auth-token", token)
      .send(comment);
  }

  beforeEach(async () => {
    server = require("../../index");
    token = new User({ name: "test" }).generateAuthToken();
    reply = new Reply({ author: "test", message: "reply" });
    comment = {
      author: "test",
      message: "message",
      replies: [reply],
    };
    commentUpdates = {
      author: "test",
      message: "updated",
    };
    replyUpdates = {
      author: "test",
      message: "updated reply",
    };
  });
  afterEach(async () => {
    //Clean up database
    await Comment.deleteMany({});
    await server.close();
  });

  describe("POST /:name - Comments", () => {
    const exec = async () => {
      return postComment();
    };

    it("should return 401 if not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 400 if author is too short", async () => {
      comment.author = "a";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if author is more than 50 characters", async () => {
      comment.author = new Array(52).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if message doesnt exist", async () => {
      comment.message = "";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if message is more than 255 characters", async () => {
      comment.message = new Array(257).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should save the comment if comment is valid", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      const commentInDB = await Comment.find(comment);
      expect(commentInDB).not.toBeNull();
    });

    it("should return the comment if comment is valid", async () => {
      const res = await exec();
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("author", "test");
      expect(res.body).toHaveProperty("message", "message");
      expect(res.body).toHaveProperty("replies");
    });
  });

  describe("POST /:name/:id - Replies", () => {
    beforeEach(async () => {
      const res = await postComment();
      comment._id = res.body._id;
      connectionString = `/api/comments/test/${comment._id}`;
    });
    const exec = async () => {
      return request(server)
        .post(connectionString)
        .set("x-auth-token", token)
        .send(reply);
    };

    it("should return 401 if not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 404 if there is an invalid id param", async () => {
      connectionString = `/api/comments/test/${mongoose.Types.ObjectId().toHexString()}`;
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return 400 if author is too short", async () => {
      reply.author = "a";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if author is more than 50 characters", async () => {
      reply.author = new Array(52).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if message doesnt exist", async () => {
      reply.message = "";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if message is more than 255 characters", async () => {
      reply.message = new Array(257).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should add the new reply to the comment", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      const commentInDB = await Comment.findById(comment._id);
      expect(commentInDB).not.toBeNull();
      expect(commentInDB.replies.length).toBe(2);
    });

    it("should return only the new reply", async () => {
      const res = await exec();
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("author", "test");
      expect(res.body).toHaveProperty("message", "reply");
      expect(res.body).not.toHaveProperty("replies");
    });
  });

  describe("GET /:name - Comments", () => {
    it("should return all comments in that collection", async () => {
      //Populate the database
      await Comment.collection.insertMany([
        { author: "author1", message: "message1" },
        { author: "author2", message: "message2" },
      ]);
      const res = await request(server).get("/api/comments/test");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some((c) => c.author === "author1")).toBeTruthy();
      expect(res.body.some((c) => c.author === "author2")).toBeTruthy();
      expect(res.body.some((c) => c.message === "message1")).toBeTruthy();
      expect(res.body.some((c) => c.message === "message2")).toBeTruthy();
    });
  });

  describe("PUT /:name - Comments", () => {
    beforeEach(async () => {
      const res = await postComment();
      commentUpdates._id = res.body._id;
    });
    const exec = async () => {
      return request(server)
        .put("/api/comments/test")
        .set("x-auth-token", token)
        .send(commentUpdates);
    };

    it("should return 401 if not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 401 if id is invalid", async () => {
      commentUpdates._id = mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 400 if message doesnt exist", async () => {
      commentUpdates.message = "";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if message is more than 255 characters", async () => {
      commentUpdates.message = new Array(257).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should not allow the orginal author to be modified", async () => {
      commentUpdates.author = "updated";
      const res = await exec();
      const commentInDB = await Comment.findById(commentUpdates._id);
      expect(commentInDB).toHaveProperty("author", "test");
    });

    it("should return the updated comment original author", async () => {
      commentUpdates.author = "updated";
      const res = await exec();
      expect(res.body).toHaveProperty("author", "test");
    });

    it("should mark the saved updated comment as edited", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      const commentInDB = await Comment.findById(commentUpdates._id);
      expect(commentInDB).toHaveProperty("isEdited", true);
    });

    it("should mark the returned updated comment as edited", async () => {
      const res = await exec();
      expect(res.body).toHaveProperty("isEdited", true);
    });

    it("should save the updated comment message", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      const commentInDB = await Comment.findById(commentUpdates._id);
      expect(commentInDB).toHaveProperty("message", "updated");
    });

    it("should return the updated comment message", async () => {
      const res = await exec();
      expect(res.body).toHaveProperty("message", "updated");
    });

    it("should not allow replies to be modified", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      const commentInDB = await Comment.findById(commentUpdates._id);
      expect(commentInDB.replies[0]).toHaveProperty("_id");
      expect(commentInDB.replies[0]).toHaveProperty("author", reply.author);
      expect(commentInDB.replies[0]).toHaveProperty("message", reply.message);
    });

    it("should return the original replies", async () => {
      const res = await exec();
      expect(res.body.replies[0]).toHaveProperty("_id");
      expect(res.body.replies[0]).toHaveProperty("author", reply.author);
      expect(res.body.replies[0]).toHaveProperty("message", reply.message);
    });
  });

  describe("PUT /:name/:id - Replies", () => {
    beforeEach(async () => {
      const res = await postComment();
      comment._id = res.body._id;
      connectionString = `/api/comments/test/${comment._id}`;
      replyUpdates._id = comment.replies[0]._id;
    });
    const exec = async () => {
      return request(server)
        .put(connectionString)
        .set("x-auth-token", token)
        .send(replyUpdates);
    };

    it("should return 401 if not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 400 if message doesnt exist", async () => {
      replyUpdates.message = "";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if message is more than 255 characters", async () => {
      replyUpdates.message = new Array(257).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 404 if there is an invalid id param", async () => {
      connectionString = `/api/comments/test/${mongoose.Types.ObjectId().toHexString()}`;
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return 404 if the reply id is invalid", async () => {
      replyUpdates._id = mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return only the updated reply", async () => {
      const res = await exec();
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("author", "test");
      expect(res.body).toHaveProperty("message", "updated reply");
      expect(res.body).not.toHaveProperty("replies");
    });

    it("should mark the saved updated reply as edited", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      const commentInDB = await Comment.findById(comment._id);
      const replyInDB = commentInDB.replies[0];
      expect(replyInDB).toHaveProperty("isEdited", true);
    });

    it("should mark the returned updated comment as edited", async () => {
      const res = await exec();
      expect(res.body).toHaveProperty("isEdited", true);
    });

    it("should not allow the orginal author to be modified", async () => {
      replyUpdates.author = "updated";
      const res = await exec();
      const commentInDB = await Comment.findById(comment._id);
      const replyInDB = commentInDB.replies[0];
      expect(replyInDB).toHaveProperty("author", "test");
    });

    it("should return the updated reply original author", async () => {
      replyUpdates.author = "updated";
      const res = await exec();
      expect(res.body).toHaveProperty("author", "test");
    });
  });

  describe("DELETE /:name - Comments", () => {
    beforeEach(async () => {
      const res = await postComment();
      comment._id = res.body._id;
    });
    const exec = async () => {
      return request(server)
        .delete("/api/comments/test")
        .set("x-auth-token", token)
        .send({ _id: comment._id });
    };

    it("should return 401 if not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 403 if user is not an admin", async () => {
      const res = await exec();
      expect(res.status).toBe(403);
    });

    it("should return 404 if user is an admin but id is invalid", async () => {
      token = new User({ name: "test", isAdmin: true }).generateAuthToken();
      comment._id = mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should be removed from the database if user is an admin and valid id was sent", async () => {
      token = new User({ name: "test", isAdmin: true }).generateAuthToken();
      const res = await exec();
      expect(res.status).toBe(200);
      const commentInDB = await Comment.findById(comment._id);
      expect(commentInDB).toBeNull();
    });
  });

  describe("DELETE /:name/:id - Replies", () => {
    beforeEach(async () => {
      token = new User({ name: "test", isAdmin: true }).generateAuthToken();
      const res = await postComment();
      comment._id = res.body._id;
      connectionString = `/api/comments/test/${comment._id}`;
    });
    const exec = async () => {
      return request(server)
        .delete(connectionString)
        .set("x-auth-token", token)
        .send({ _id: reply._id });
    };

    it("should return 401 if not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 403 if user is not an admin", async () => {
      token = new User({ name: "test" }).generateAuthToken();
      const res = await exec();
      expect(res.status).toBe(403);
    });

    it("should return 404 if user is an admin but invalid id param", async () => {
      connectionString = `/api/comments/test/${mongoose.Types.ObjectId().toHexString()}`;
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return 404 if user is an admin but invalid reply id", async () => {
      reply._id = mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should remove the specified reply from the comment; keeping comment intact", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      const commentInDB = await Comment.findById(comment._id);
      expect(commentInDB).not.toBeNull();
      expect(commentInDB.replies.length).toBe(0);
    });
  });
});

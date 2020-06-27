const request = require("supertest");
const mongoose = require("mongoose");
const fs = require("fs");
const moment = require("moment");
const { Blog, BlogContent } = require("../../mongoose_models/blog");
const { User } = require("../../mongoose_models/user");
let server;

describe("/api/blog", () => {
  let token;
  let blog;
  let blogId;
  //get buffer data that will be sent to our server from the client
  let imageData = fs.readFileSync(`tests/test.png`);

  const postBlog = (blogData = blog) => {
    return request(server)
      .post("/api/blog")
      .set("x-auth-token", token)
      .send(blogData);
  };

  const checkFilledBlogData = (blogData) => {
    expect(blogData).toHaveProperty("author", "test");
    expect(blogData).toHaveProperty("date");
  };

  const checkBlogData = (blogData, length = 4) => {
    expect(blogData).toHaveProperty("_id");
    expect(blogData).toHaveProperty("category", "testing/test1");
    expect(blogData).toHaveProperty("content");
    const { content } = blogData;
    expect(content.length).toBe(length);
    content.forEach((item) => {
      expect(item).toHaveProperty("contentType");
      expect(item).toHaveProperty("data");
      if (item.contentType === 3) expect(item).toHaveProperty("imageData");
    });
  };

  beforeEach(async () => {
    server = require("../../index");
    token = new User({ name: "test", isAdmin: true }).generateAuthToken();
    blog = {
      category: "testing/test1",
      content: [
        { contentType: 0, data: ["This is a title"] },
        { contentType: 1, data: ["This is a header"] },
        { contentType: 2, data: ["This is a paragraph"] },
        { contentType: 3, imageData },
      ],
    };
  });

  afterEach(async () => {
    //Clean up database
    await Blog.deleteMany({});
    await server.close();
  });

  describe("POST / - Blogs", () => {
    const exec = async () => {
      return postBlog();
    };

    it("should return 403 if user is not an admin", async () => {
      token = new User({ name: "test", isAdmin: false }).generateAuthToken();
      const res = await exec();
      expect(res.status).toBe(403);
    });

    it("should return 400 if blog does not begin with a title", async () => {
      blog.content = [{ contentType: 1, data: ["This is a header"] }];
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if catergory already exists in the database", async () => {
      let res = await exec();
      res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return the blog with the correct data", async () => {
      const res = await exec();
      checkBlogData(res.body);
    });

    it("should automatically fill out author and date properties", async () => {
      const res = await exec();
      checkFilledBlogData(res.body);
    });

    it("should save the blog in the database with the correct data", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      const blogInDB = await Blog.findById(res.body._id);
      checkFilledBlogData(blogInDB);
      checkBlogData(blogInDB);
    });
  });

  describe("GET / - Blogs", () => {
    beforeEach(async () => {
      await postBlog();
    });

    it("should return all blogs in date order", async () => {
      //Populate the database
      await postBlog({
        category: "testing/test2",
        date: moment().add(-31, "minutes").toDate(),
        content: [
          { contentType: 0, data: ["This is a title"] },
          { contentType: 1, data: ["This is a header"] },
          { contentType: 2, data: ["This is a paragraph"] },
          { contentType: 3, imageData },
        ],
      });
      await postBlog({
        category: "testing/test3",
        date: moment().add(-61, "minutes").toDate(),
        content: [
          { contentType: 0, data: ["This is a title"] },
          { contentType: 1, data: ["This is a header"] },
          { contentType: 2, data: ["This is a paragraph"] },
          { contentType: 3, imageData },
        ],
      });
      const res = await request(server).get("/api/blog");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
      //Latest blog should be first so test1, test2, test3; catergories are always unique
      const blogs = res.body;
      expect(blogs[0]).toHaveProperty("category", "testing/test1");
      expect(blogs[1]).toHaveProperty("category", "testing/test2");
      expect(blogs[2]).toHaveProperty("category", "testing/test3");
    });
  });

  describe("GET /:id - Blogs", () => {
    beforeEach(async () => {
      const res = await postBlog();
      blogId = res.body._id;
    });

    const exec = async () => {
      return request(server).get(`/api/blog/${blogId}`);
    };

    it("should return 404 if an invalid id is given", async () => {
      blogId = mongoose.Types.ObjectId().toHexString();
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return the requested blog", async () => {
      const res = await exec();
      checkFilledBlogData(res.body);
      checkBlogData(res.body);
    });
  });

  describe("PUT /:id - Blogs", () => {
    let updatedBlog;
    beforeEach(async () => {
      const res = await postBlog();
      blogId = res.body._id;
      updatedBlog = {
        category: "testing/test1-u",
        content: [
          { contentType: 0, data: ["This is a title"] },
          { contentType: 3, imageData },
        ],
      };
    });

    const exec = async (blogData = blog) => {
      return request(server)
        .put(`/api/blog/${blogId}`)
        .set("x-auth-token", token)
        .send(blogData);
    };

    const checkUpdatedBlogData = (blogData) => {
      expect(blogData).toHaveProperty("category", "testing/test1-u");
      expect(blogData).toHaveProperty("content");
      const { content } = blogData;
      expect(content.length).toBe(2);
      content.forEach((item) => {
        expect(item).toHaveProperty("contentType");
        expect(item).toHaveProperty("data");
        if (item.contentType === 3) expect(item).toHaveProperty("imageData");
      });
    };

    it("should return 403 if user is not an admin", async () => {
      token = new User({ name: "test", isAdmin: false }).generateAuthToken();
      const res = await exec();
      expect(res.status).toBe(403);
    });

    it("should return 400 if blog does not begin with a title", async () => {
      blog.content = [{ contentType: 1, data: ["This is a header"] }];
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 404 if an invalid id is given", async () => {
      blogId = mongoose.Types.ObjectId().toHexString();
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return the updated blog with the new data sent", async () => {
      const res = await exec(updatedBlog);
      expect(res.status).toBe(200);
      checkUpdatedBlogData(res.body);
    });

    it("should update the blog in the database", async () => {
      const res = await exec(updatedBlog);
      expect(res.status).toBe(200);
      const blogInDB = await Blog.findById(blogId);
      expect(blogInDB).not.toBeNull();
      checkUpdatedBlogData(blogInDB);
    });
  });
});

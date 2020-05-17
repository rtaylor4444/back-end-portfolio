const { User } = require("../../mongoose_models/user");
const { createModel } = require("../../mongoose_models/comment");
const request = require("supertest");
let server;

describe("auth middleware", () => {
  let token;
  let Comment = createModel("test");
  beforeEach(async () => {
    server = require("../../index");
    token = new User().generateAuthToken();
  });
  afterEach(async () => {
    //Clean up database
    await Comment.deleteMany({});
    await server.close();
  });

  const exec = async () => {
    return await request(server)
      .post("/api/comments/test")
      .set("x-auth-token", token)
      .send({ author: "test", message: "message" });
  };

  it("should return 401 if no token is provided", async () => {
    token = "";
    const res = await exec();
    expect(res.status).toBe(401);
  });

  it("should return 400 if token is invalid", async () => {
    token = "a";
    const res = await exec();
    expect(res.status).toBe(400);
  });

  it("should return 200 if token is valid", async () => {
    const res = await exec();
    expect(res.status).toBe(200);
  });
});

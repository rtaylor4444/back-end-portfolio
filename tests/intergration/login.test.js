const { User } = require("../../mongoose_models/user");
const request = require("supertest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("config");
let server;

describe("/api/login", () => {
  let user;
  beforeEach(async () => {
    server = require("../../index");
    user = { name: "test", email: "test@test.com", password: "12345" };
    //Hash Password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await User.collection.insertOne(user);
    user.password = "12345";
  });
  afterEach(async () => {
    //Clean up database
    await User.deleteMany({});
    await server.close();
  });

  describe("POST /", () => {
    const exec = async () => {
      return request(server).post("/api/login").send(user);
    };

    it("should return 400 if email is not registered", async () => {
      user.email = "notFound@test.com";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if password is incorrect", async () => {
      user.password = "12346";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return a valid JWT if credentials are correct", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      const token = res.text;
      const decoded = jwt.verify(token, config.get("jwtPrivateKey"));
      expect(decoded).toHaveProperty("_id");
      expect(decoded).toHaveProperty("name");
      expect(decoded).toHaveProperty("email");
      expect(decoded).toHaveProperty("isAdmin");
    });
  });
});

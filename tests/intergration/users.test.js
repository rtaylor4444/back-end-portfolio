const { User, unconfirmedUsers } = require("../../mongoose_models/user");
const request = require("supertest");
const emailService = require("../../services/emailService");
const config = require("config");
const jwt = require("jsonwebtoken");

let server;
describe("/api/users", () => {
  let user;
  beforeEach(async () => {
    server = require("../../index");
    user = { name: "test", email: "test@test.com", password: "12345" };
    emailService.sendConfirmationEmail = jest.fn();
  });
  afterEach(async () => {
    //Clean up database
    await User.deleteMany({});
    await server.close();
  });

  function registerUser() {
    return request(server).post("/api/users").send(user);
  }

  describe("POST /", () => {
    const exec = async () => {
      return registerUser();
    };

    it("should return 400 if email is already registered", async () => {
      await User.collection.insertOne(user);
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if email is empty", async () => {
      user.email = "";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if email is not a valid email", async () => {
      user.email = "testing";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if name is empty", async () => {
      user.name = "";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if name is too short", async () => {
      user.name = "aa";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if name is too long", async () => {
      user.name = new Array(52).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if password is empty", async () => {
      user.password = "";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if password is too long", async () => {
      user.password = new Array(1026).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should verify the users email by sending a code", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(emailService.sendConfirmationEmail).toHaveBeenCalled();
      expect(emailService.sendConfirmationEmail.mock.calls[0][1]).toMatch(
        user.email
      );
    });

    it("should add the new user to an unconfirmed list", async () => {
      const mapSize = unconfirmedUsers.size;
      const res = await exec();
      expect(res.status).toBe(200);
      expect(unconfirmedUsers.size).toBe(mapSize + 1);
    });

    it("should send the client a confirmation string", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.text).toBeDefined();
    });
  });

  describe("POST /confirm", () => {
    let code;
    beforeEach(async () => {
      await registerUser();
      code = emailService.sendConfirmationEmail.mock.calls[0][0];
    });

    const exec = async () => {
      return request(server).post("/api/users/confirm").send({ code });
    };

    it("should return 400 if code is incorrect", async () => {
      code = "";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should remove user from the unconfirmed list if information is correct", async () => {
      const mapSize = unconfirmedUsers.size;
      const res = await exec();
      expect(res.status).toBe(200);
      expect(unconfirmedUsers.size).toBe(mapSize - 1);
    });

    it("should place a token in x-auth-token header if information is correct", async () => {
      const res = await exec();
      const token = res.header["x-auth-token"];
      expect(jwt.verify(token, config.get("jwtPrivateKey"))).toBeTruthy();
    });

    it("should send user info excluding the password to the client", async () => {
      const res = await exec();
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("name", user.name);
      expect(res.body).toHaveProperty("email", user.email);
      expect(res.body).not.toHaveProperty("password");
    });
  });
});

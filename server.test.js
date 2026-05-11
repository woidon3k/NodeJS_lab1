const request = require("supertest");
const app = require("./server");
const sequelize = require("./config/database");

afterAll(async () => {
  await sequelize.close();
});

describe("API Testing (Lab 5)", () => {
  // test 1: check if status endpoint works
  test("GET /status should return 200 and server stats", async () => {
    const response = await request(app).get("/status"); //

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("uptime");
    expect(response.body).toHaveProperty("memoryUsage");
  });

  // test 2: check if Validator works
  test("POST /register should fail with 400 if validation fails", async () => {
    const response = await request(app).post("/register").send({
      name: "", // empty name (fails validation)
      email: "not-an-email", // invalid email (fails validation)
      password: "123", // too short (fails validation)
      password_confirmation: "123",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("errors");
  });
});

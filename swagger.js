const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Retail Users API",
    version: "1.0.0",
    description: "API documentation for the Retail system [Lab 6]",
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/status": {
      get: {
        summary: "Отримати статус сервера",
        tags: ["System"],
        responses: {
          200: {
            description: "Статус сервера (uptime та використання пам'яті)",
          },
        },
      },
    },
    "/login": {
      post: {
        summary: "Авторизація користувача",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", example: "manager@example.com" },
                  password: { type: "string", example: "secret123" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Успішний вхід (повертає токен)" },
          400: { description: "Невірний email або пароль" },
        },
      },
    },
    "/register": {
      post: {
        summary: "Створити користувача",
        tags: ["Users"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Ivan" },
                  email: { type: "string", example: "ivan@example.com" },
                  password: { type: "string", example: "secret123" },
                  password_confirmation: {
                    type: "string",
                    example: "secret123",
                  },
                  role: {
                    type: "string",
                    enum: ["manager", "cashier"],
                    example: "cashier",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Користувача створено" },
          400: { description: "Помилка валідації" },
        },
      },
    },
    "/users": {
      get: {
        summary: "Отримати всіх користувачів",
        tags: ["Users"],
        responses: {
          200: { description: "Список користувачів (cached)" },
          401: { description: "Немає токена або невірний токен" },
          403: { description: "Недостатньо прав (потрібен менеджер)" },
        },
      },
    },
    "/users/{id}": {
      get: {
        summary: "Отримати користувача за ID",
        tags: ["Users"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: { description: "Дані користувача" },
          404: { description: "Користувача не знайдено" },
        },
      },
      delete: {
        summary: "Видалити користувача",
        tags: ["Users"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: { description: "Користувача успішно видалено" },
          404: { description: "Користувача не знайдено" },
        },
      },
    },
  },
};

module.exports = swaggerDocument;

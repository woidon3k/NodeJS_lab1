require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const morgan = require("morgan");
const winston = require("winston");
const multer = require("multer");

const helmet = require("helmet");
const { body, validationResult } = require("express-validator");
const NodeCache = require("node-cache");

const sequelize = require("./config/database");
const User = require("./models/User");
const authenticateToken = require("./middleware/auth");
const authorizeRoles = require("./middleware/role");

const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret_key";
const app = express();

const cache = new NodeCache({ stdTTL: 60 }); // 60 sec for cache
app.use(helmet());

// ensure the uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// file logging with Winston
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: "app.log" }),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

// HTTP Request Logging with Morgan
app.use(morgan("dev"));

app.use(express.json());

// middleware to measure response time and log it
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} - ${duration}ms`);
  });
  next();
});

// file validation & custom storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Неправильний формат файлу. Дозволено лише JPG, PNG, або PDF"),
      false,
    );
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
});

// single file
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ message: "Файл успішно завантажено", file: req.file });
});

// multiple files (up to 5)
app.post("/upload-multiple", upload.array("files", 5), (req, res) => {
  res.json({ message: "Файли успішно завантажено", files: req.files });
});

// server status
app.get("/status", (req, res) => {
  res.json({
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

app.get(
  "/admin/stats",
  authenticateToken,
  authorizeRoles("manager"),
  (req, res) => {
    res.json({ message: "For admin" });
  },
);

app.post(
  "/orders",
  authenticateToken,
  authorizeRoles("cashier"),
  (req, res) => {
    res.json({ message: "For cashier" });
  },
);

app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { message: "Забагато спроб входу. Спробуйте через 15 хвилин." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.patch("/change-password", authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Старий пароль невірний" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Пароль успішно змінено" });
  } catch (error) {
    res.status(500).json({ message: "Помилка сервера" });
  }
});

// Caching Example Route
app.get(
  "/users",
  authenticateToken,
  authorizeRoles("manager"),
  async (req, res) => {
    const cachedUsers = cache.get("all_users");
    if (cachedUsers) {
      return res.json({ source: "cache", data: cachedUsers });
    }

    try {
      const users = await User.findAll({
        attributes: { exclude: ["password"] },
      });
      cache.set("all_users", users);
      res.json({ source: "database", data: users });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Помилка сервера" });
    }
  },
);

app.delete(
  "/users/:id",
  authenticateToken,
  authorizeRoles("manager"),
  async (req, res) => {
    try {
      const userIdToDelete = req.params.id;

      const user = await User.findByPk(userIdToDelete);
      if (!user) {
        return res.status(404).json({ message: "Користувача не знайдено" });
      }

      await user.destroy();
      cache.del("all_users"); // invalidate cache
      res.json({
        message: `Користувача з ID ${userIdToDelete} видалено менеджером`,
      });
    } catch (error) {
      res.status(500).json({ message: "Помилка сервера" });
    }
  },
);

app.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        SECRET_KEY,
        { expiresIn: "1h" },
      );

      return res.status(200).json({
        message: "User logged in successfully",
        token: token,
      });
    } else {
      return res
        .status(400)
        .json({ message: "Email or password is incorrect" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
});

app.post("/logout", (req, res) => {
  res.json({ message: "Вихід виконано. Видаліть токен із заголовків запиту." });
});

// data validation added to /register
app.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Ім'я є обов'язковим").escape(),
    body("email")
      .isEmail()
      .withMessage("Некоректний формат email")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Пароль має містити мінімум 6 символів"),
    body("role")
      .optional()
      .isIn(["manager", "cashier"])
      .withMessage("Некоректна роль"),
  ],
  async (req, res) => {
    try {
      // validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, password_confirmation, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (password !== password_confirmation) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password too short" });
      }

      const userExists = await User.findOne({ where: { email } });
      if (userExists) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || "cashier",
      });

      cache.del("all_users"); // invalidate cache

      res
        .status(201)
        .json({ message: "User created successfully", userId: newUser.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// global error handler
app.use((err, req, res, next) => {
  logger.error(`Помилка: ${err.message}`); // catch Multer errors

  if (
    err instanceof multer.MulterError ||
    err.message.includes("Неправильний формат")
  ) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: "Внутрішня помилка сервера" });
});

const PORT = process.env.PORT || 3000;
// only start the server if this file is run directly (not by Jest)
if (require.main === module) {
  sequelize.sync().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });
}

module.exports = app;

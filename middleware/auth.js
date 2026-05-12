require("dotenv").config();
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret_key";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Немає токена" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Невірний токен" });
  }
};

module.exports = authenticateToken;

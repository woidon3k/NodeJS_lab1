require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const User = require('./models/User');
const jwt = require('jsonwebtoken')
const SECRET_KEY = process.env.JWT_SECRET || 'fallback_secret_key';
const authenticateToken = require("./middleware/auth")
const authorizeRoles = require('./middleware/role');
const app = express();
app.use(express.json());




app.get('/admin/stats', authenticateToken, authorizeRoles('manager'), (req, res) => {
    res.json({ message: "For admin" });
});

app.post('/orders', authenticateToken, authorizeRoles('cashier'), (req, res) => {
    res.json({ message: "For cashier" });
});

app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] } 
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


const rateLimit = require('express-rate-limit');


const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 5, 
  message: { message: "Забагато спроб входу. Спробуйте через 15 хвилин." },
  standardHeaders: true, 
  legacyHeaders: false,
});

app.patch('/change-password', authenticateToken, async (req, res) => {
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

app.delete('/users/:id', authenticateToken, authorizeRoles('manager'), async (req, res) => {
    try {
        const userIdToDelete = req.params.id;

        const user = await User.findByPk(userIdToDelete);
        if (!user) {
            return res.status(404).json({ message: "Користувача не знайдено" });
        }

        await user.destroy();
        res.json({ message: `Користувача з ID ${userIdToDelete} видалено менеджером` });
    } catch (error) {
        res.status(500).json({ message: "Помилка сервера" });
    }
});

app.post('/login', loginLimiter , async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (user && await bcrypt.compare(password, user.password)) {
      
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        SECRET_KEY,
        { expiresIn: '1h' }
      );

      return res.status(200).json({ 
        message: "User logged in successfully",
        token: token 
      });
    } else {
      return res.status(400).json({ message: "Email or password is incorrect" });
    }
    
  } catch (error) {
    console.error(error); // Fix: pass error to console.error
    return res.status(500).json({ message: "Server Error" });
  }
});

app.post('/logout', (req, res) => {
    res.json({ message: "Вихід виконано. Видаліть токен із заголовків запиту." });
});


app.post('/register', async (req, res) => {
  try {
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
      role: role || 'cashier'
    });

    res.status(201).json({ message: "User created successfully", userId: newUser.id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
sequelize.sync({alter: true}).then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
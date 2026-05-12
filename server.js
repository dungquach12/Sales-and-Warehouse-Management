require("dotenv").config();

const path = require("path");
const express = require("express");
const expressHbs = require("express-handlebars");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken"); // ← ADD THIS

const app = express();
const PORT = process.env.PORT || 3000;

// Import auth middleware
const { requireAuth, requireAuthApi } = require("./utils/checkAuth");

// Configure static web folders
app.use(express.static(__dirname + "/html"));

// Configure view templates
app.engine('hbs', expressHbs.engine({
  layoutsDir: __dirname + "/views/layouts",
  partialsDir: __dirname + "/views/partials",
  extname: "hbs",
  defaultLayout: "layout",
  helpers: {
    eq: (a, b) => a === b,
    formatDate: (date) => {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
    },
    formatPrice: (price) => price ? Number(price).toLocaleString('vi-VN') + 'đ' : '—',
    json: (data) => JSON.stringify(data),
    marginClass: (margin) => {
      if (margin >= 40) return 'text-success';
      if (margin >= 20) return 'text-warning';
      return 'text-danger';
    },
    section: function (name, options) {
      if (!this._sections) this._sections = {};
      this._sections[name] = options.fn(this);
      return null;
    }
  }
}));

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// --- GLOBAL MIDDLEWARE ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- CRITICAL: JWT Verification Middleware ---
// This runs on EVERY request and sets req.user if token is valid
app.use((req, res, next) => {
  const token = req.cookies?.token;
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token invalid or expired
      if (error.name === 'TokenExpiredError') {
        console.log('Token expired for:', req.path);
      }
      req.user = null;
      // Optionally clear the invalid cookie
      res.clearCookie('token');
    }
  } else {
    req.user = null;
  }
  next();
});

// Cache control for all routes
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// --- PUBLIC ROUTES (No authentication required) ---
app.use("/", require("./routes/authRoutes"));
app.use('/api/v1/auth', require('./routes/api/v1/authApiRoutes'));

// --- PROTECTED PAGE ROUTES (SSR / HTML) ---
// These use requireAuth - redirects to login if not authenticated
app.use("/report", requireAuth, require("./routes/reportRoutes"));
app.use("/products", requireAuth, require("./routes/productRoutes"));
app.use("/order", requireAuth, require("./routes/orderRoutes"));

// --- PROTECTED API ROUTES (JSON) ---
// These use requireAuthApi - returns 401 JSON if not authenticated
app.use('/api/v1/customer', requireAuthApi, require('./routes/api/v1/customerApiRoutes'));
app.use('/api/v1/products', requireAuthApi, require('./routes/api/v1/productApiRoutes'));
app.use('/api/v1/report', requireAuthApi, require('./routes/api/v1/reportApiRoutes'));
app.use('/api/v1/order', requireAuthApi, require('./routes/api/v1/orderApiRoutes'));

// --- Simple protected pages (using requireAuth, NOT requireAuthApi) ---
app.get('/categories', requireAuth, (req, res) => {
  res.render('wip', {
    title: 'Mẫu mã',
    activeMenu: 'categories',
    activeParent: 'productManage',
    user: req.user // Pass user to template
  });
});

app.get('/order-history', requireAuth, (req, res) => {
  res.render('wip', {
    title: 'Lịch sử đơn hàng',
    activeMenu: 'order-history',
    user: req.user
  });
});

app.get('/menu', requireAuth, (req, res) => {
  res.render('wip', {
    title: 'Menu',
    activeMenu: 'menu',
    user: req.user
  });
});

// --- Start Server ---
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}!`));
}

module.exports = app;
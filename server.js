require("dotenv").config();

const path = require("path");
const express = require("express");
const expressHbs = require("express-handlebars");
const app = express();

const PORT = process.env.PORT || 3000;

const cookieParser = require("cookie-parser");
app.use(cookieParser());
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
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});


// --- PUBLIC ROUTES ---
app.use("/", require("./routes/authRoutes"));
app.use('/api/v1/auth', require('./routes/api/v1/authApiRoutes'));


// --- PROTECTED PAGE ROUTES (SSR / HTML) ---
app.use("/report", requireAuth,require("./routes/reportRoutes"));
app.use("/products", requireAuth, require("./routes/productRoutes"));


// --- PROTECTED API ROUTES (JSON) ---
app.use('/api/v1/products', requireAuthApi, require('./routes/api/v1/productApiRoutes'));


app.get('/categories', requireAuthApi,(req, res) => {
  res.render('wip', {
    title: 'Mẫu mã',
    activeMenu: 'categories',
    activeParent: 'productManage'
  });
});

app.get('/sales', requireAuthApi, (req, res) => {
  res.render('sales', {
    title: 'Bán hàng',
    activeMenu: 'sales',
    pageCSS: 'sales.css'
  });
});

app.get('/notifications', requireAuthApi, (req, res) => {
  res.render('wip', {
    title: 'Thông báo',
    activeMenu: 'notifications',
    activeParent: 'productManage'
  });
});


app.get('/menu', requireAuthApi, (req, res) => {
  res.render('wip', {
    title: 'Menu',
    activeMenu: 'menu',
    activeParent: 'productManage',
  });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => console.log('Server running!'));
}

module.exports = app;
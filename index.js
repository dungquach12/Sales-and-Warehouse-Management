const path = require("path");
const express = require("express");
const expressHbs = require("express-handlebars");
const app = express();

const PORT = 3000;

const session = require("express-session");

const { User } = require("./models");   // Import the User model
const { where } = require("sequelize");

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
    // createPagination,
    formatDate: (date) => {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
    },
  }
}));

app.set("view engine", "hbs");

// Middleware to parse request bodies
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Session config
app.use(session({
    secret: process.env.SESSION_SECRET || "my secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 20 * 60 * 1000, // 20 minutes
        httpOnly: true,
        secret: false, // True if use https
    }
}))

// Routes
// ------- Authenticate ------------
app.use("/", require("./routes/authRouter.js"));
// ---------------------------------

app.get('/report', (req, res) => {
  res.render('report', {
    title: 'Tổng quan',
    activeMenu: 'report',
    pageCSS: 'report.css'
  });
});

app.get('/products', (req, res) => {
  res.render('productManage/products', { 
    title: 'Sản phẩm',
    activeMenu: 'products',
    activeParent: 'productManage',
    pageCSS: 'products.css'
  });
});

app.get('/categories', (req, res) => {
  res.render('wip', { 
    title: 'Mẫu mã',
    activeMenu: 'categories',
    activeParent: 'productManage' 
  });
});

app.get('/sales', (req, res) => {
  res.render('sales', { 
    title: 'Bán hàng',
    activeMenu: 'sales',
    pageCSS: 'sales.css'
  });
});

app.get('/notifications', (req, res) => {
  res.render('wip', { 
    title: 'Thông báo',
    activeMenu: 'notifications',
    activeParent: 'productManage' 
  });
});


app.get('/menu', (req, res) => {
  res.render('wip', { 
    title: 'Menu',
    activeMenu: 'menu',
    activeParent: 'productManage',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running! Open http://localhost:${PORT} in your browser.`);
});
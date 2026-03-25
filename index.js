const path = require("path");
const express = require("express");
const expressHbs = require("express-handlebars");
const app = express();

const PORT = 3000;

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

// Routes

// ------- Authenticate ------------
app.get('/login', (req, res) => {
  res.render('authenticate/auth-login', {
    title: 'Đăng nhập',
    layout: 'auth-layout'
  });
});
app.get('/register', (req, res) => {
  res.render('authenticate/auth-register', {
    title: 'Đăng ký',
    layout: 'auth-layout'
  });
});
// ---------------------------------

app.get('/', (req, res) => {
  res.render('report', {
    title: 'Tổng quan',
    activeMenu: 'report',
    pageCSS: 'report.css'
  });
});

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

app.get('/dev', (req, res) => {
  res.render('dev', { 
    title: 'dev',
    activeMenu: 'dev',
    activeParent: 'dev' 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running! Open http://localhost:${PORT} in your browser.`);
});
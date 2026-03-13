const http = require('http');
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
app.get('/', (req, res) => {
  res.render('wip', {
    title: 'Tổng quan',
    activeMenu: 'report'
  });
});

app.get('/report', (req, res) => {
  res.render('wip', {
    title: 'Tổng quan',
    activeMenu: 'report'
  });
});

app.get('/products', (req, res) => {
  res.render('productManage/product', { 
    title: 'Sản phẩm',
    activeMenu: 'products',
    activeParent: 'productManage' 
  });
});

app.get('/orders', (req, res) => {
  res.render('wip', { 
    title: 'Đơn hàng',
    activeMenu: 'orders',
    activeParent: 'productManage' 
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
    activeParent: 'productManage' 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running! Open http://localhost:${PORT} in your browser.`);
});
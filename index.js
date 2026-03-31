const path = require("path");
const express = require("express");
const expressHbs = require("express-handlebars");
const app = express();

const PORT = 3000;

const session = require("express-session");

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
    }
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

// Make session available to templates
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Pages routes
app.use("/", require("./routes/authRoutes"));
// ---------------------------------
app.use("/report", require("./routes/reportRoutes"));

app.use("/products", require("./routes/productRoutes"));

// API routes
app.use('/api/auth', require('./routes/api/authApiRoutes'));
// app.use('/api/products', require('./routes/api/productApiRoutes'));

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
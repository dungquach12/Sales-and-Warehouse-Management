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
  res.render('report');
});

app.get('/report', (req, res) => {
  res.render('report');
});

app.get('/good', (req, res) => {
  res.render('good', { pageCSS: 'good.css' });
});

app.get('/inventory', (req, res) => {
  res.render('inventory');
});

app.get('/employees', (req, res) => {
  res.render('employees');
});

app.get('/clients', (req, res) => {
  res.render('clients');
});

app.get('/integrations', (req, res) => {
  res.render('integrations');
});

app.get('/settings', (req, res) => {
  res.render('settings');
});

app.get('/helps', (req, res) => {
  res.render('helps');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running! Open http://localhost:${PORT} in your browser.`);
});
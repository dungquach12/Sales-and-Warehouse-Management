const http = require('http');
const path = require("path");
const express = require("express");
const app = express();

const PORT = 3000;

// Configure static web folders
app.use(express.static(__dirname + "/html"));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running! Open http://localhost:${PORT} in your browser.`);
});
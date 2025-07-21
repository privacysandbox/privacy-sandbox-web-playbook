/* Copyright 2025 Google LLC.
SPDX-License-Identifier: Apache-2.0 */

const express = require('express');

const app = express();

// Include a cookie with requests for /images/kittens.jpg
app.get('/images/:name', function(req, res, next){
  
  // cat=tabby is hardcoded here, but would normally be set dynamically.
  // A value like this might be used to provide a session id for the user.
  res.setHeader('Set-Cookie', 'cat=tabby; Max-Age=86400; Secure; HTTPOnly');
  console.log(req.params);
  res.sendFile(`${__dirname}/public/images/${req.params.name}`);
});

// Include a cookie with requests to /iframe/index.html
app.get('/iframe/index.html', function(req, res, next){
  // This might be used (for example) to record that a promo banner has been displayed.
  res.setHeader('Set-Cookie', 'iframe-seen=true; Path=/; Secure; HTTPOnly');
  res.sendFile(__dirname + '/public/iframe/index.html');
});

app.get('/', function(req, res, next){
  res.sendFile(__dirname + '/views/index.html');
});

app.use(express.static('public'));


exports.cookie_1p = app;

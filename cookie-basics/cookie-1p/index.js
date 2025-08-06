/*
 * @license
 * Copyright 2025 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License
 *
 *
 * NOTE: This is not an officially supported Google product
 */


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

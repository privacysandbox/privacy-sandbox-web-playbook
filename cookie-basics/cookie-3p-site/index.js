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
  console.log('Request to /images/:name');
  // session=123 is hardcoded here, but would normally be set dynamically.
  // A value like this might be used to provide a session id for the user.
  // No SameSite attribute is provided, so the default SameSite=Lax will be applied. The Lax default blocks cross-site cookies except in response to following a link to a web page, so cross-site requests for this image will not include the cookie.
  res.setHeader('Set-Cookie', 'cat=tabby; Max-Age=86400; Secure; HTTPOnly');
  console.log(req.params);
  res.sendFile(`${__dirname}/public/images/${req.params.name}`);
});

// Include a cookie with requests to /fetch, 
// as used by the demo at fetch-cookie.glitch.me.
app.get('/fetch', function(req, res, next){
  console.log('Request to /fetch');
  // Allow cross-origin request from fetch-cookie.glitch.me demo.
  res.setHeader('Access-Control-Allow-Origin', 'https://fetch-cookie.glitch.me');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  // This might be used to record that a promo banner has been displayed, for example.
  // SameSite=None is set, so this cookie will be included in response to cross-site requests.
  res.setHeader('Set-Cookie', 'fetch=true; Secure; HTTPOnly; SameSite=None');
  res.send('Response to request to /fetch');
});

// Include a cookie with requests to /iframe/index.html
app.get('/iframe*', function(req, res, next){
  console.log('Request to /iframe');
  // This might be used to record that a promo banner has been displayed, for example.
  // SameSite=None is set, so this cookie will be included in response to cross-site requests.
  res.setHeader('Set-Cookie', 'iframe-seen=true; Secure; HTTPOnly; SameSite=None');
  res.sendFile(__dirname + '/views/iframe/index.html');
});

app.get('/', function(req, res, next){
  console.log('Request to /');
  res.send('Response to request to /');
});



app.use(express.static('public'));


const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + 
      listener.address().port);
});
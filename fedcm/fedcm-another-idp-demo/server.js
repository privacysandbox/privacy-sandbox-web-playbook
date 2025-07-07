/*
 * @license
 * Copyright 2019 Google Inc. All rights reserved.
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
 */

const path = require('path');
const express = require('express');
const session = require('express-session');
const hbs = require('hbs');
const auth = require('./libs/auth');
const { sessionCheck } = require('./libs/common');
const app = express();

app.set('view engine', 'html');

hbs.registerHelper('isEqual', (value1, value2, options) => {
  if (value1 === value2) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

app.engine('html', hbs.__express);
app.set('views', './views');
app.use(express.json());
app.use(express.static('public', { setHeaders: (res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
}}));
app.use(express.static('dist'));
app.use(session({
  secret: 'secret', // You should specify a real secret here
  resave: true,
  saveUninitialized: false,
  proxy: true,
  // store: new LowdbStore(db),
  cookie:{
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 31536000000
  }
}));

app.use((req, res, next) => {
  if (process.env.PROJECT_DOMAIN) {
    process.env.HOSTNAME = `${process.env.PROJECT_DOMAIN}.glitch.me`;
  } else {
    process.env.HOSTNAME = req.headers.host;
  }
  const protocol = /^localhost/.test(process.env.HOSTNAME) ? 'http' : 'https';
  process.env.ORIGIN = `${protocol}://${process.env.HOSTNAME}`;
  if (
    req.get('x-forwarded-proto') &&
    req.get('x-forwarded-proto').split(',')[0] !== 'https'
  ) {
    return res.redirect(301, process.env.ORIGIN);
  }
  req.schema = 'https';
  return next();
});

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', (req, res) => {
  if (req.session.username && req.session['signed-in']) {
    return res.redirect(307, '/home');
  }
  // Check session
  if (req.session.username) {
    // If the user is signed in, redirect to `/reauth`.
    return res.redirect(307, '/reauth');
  }
  // If user is not signed in, show `index.html` with id/password form.
  const ot_token = process.env.OT_TOKEN;
  res.render('index.html', { ot_token });
});

app.get('/authorization', (req, res) => {
  if (!req.session.username || !req.session['signed-in']) {
    // If the user is not signed in, redirect to `/`.
    return res.redirect(307, '/');
  }
  const ot_token = process.env.OT_TOKEN;
  res.render('authorization.html', { ot_token });
});

app.get('/iframe', (req, res) => {
  const user = res.locals.user;
  console.log(user);
  // `home.html` shows sign-out link
  const ot_token = process.env.OT_TOKEN;
  res.render('iframe.html', { ot_token });
});

app.get('/home', sessionCheck, (req, res) => {
  const user = res.locals.user;
  let back = req.query.back;
  if (!back) {
    back = 'https://fedcm-multi-idp-rp.glitch.me';
  }
  console.log(user);
  // `home.html` shows sign-out link
  res.render('home.html', {
    username: req.session.username,
    approved_clients: user.approved_clients,
    given_name: user.given_name || '',
    family_name: user.family_name || '',
    picture: user.picture || '',    
    backURL: back,
    statuses: [{
      value: '',
      string: 'Signed In'
    }, {
      value: 'session_expired',
      string: 'Session Expired'
    }, {
      value: 'invalid_request',
      string: 'Invalid Request'
    }, {
      value: 'unauthorized_client',
      string: 'Unauthorized Client'
    }, {
      value: 'access_denied',
      string: 'Access Denied'
    }, {
      value: 'server_error',
      string: 'Server Error'
    }, {
      value: 'temporarily_unavailable',
      string: 'Temporarily Unavailable'
    }],
    status: user.status,
    demo_account: user.username === 'demo@example.com'
  });
});

app.get('/reauth', (req, res) => {
  const username = req.session.username;
  if (!username) {
    return res.redirect(307, '/');
  }
  // Show `reauth.html`.
  // User is supposed to enter a password (which will be ignored)
  // Make XHR POST to `/signin`
  const ot_token = process.env.OT_TOKEN;
  res.render('reauth.html', { username, ot_token });
});

app.get('/.well-known/web-identity', (req, res) => {
  console.log('/.well-known/web-identity');

  return res.json({
    "provider_urls": ["https://fedcm-another-idp-demo.glitch.me/fedcm.json" ]
  });
});

app.get('/fedcm.json', (req, res) => {
  console.log('/fedcm.json');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  return res.json({
    "accounts_endpoint": "/auth/accounts",
    "client_metadata_endpoint": "/auth/metadata",
    "id_assertion_endpoint": "/auth/idtokens",
    "disconnect_endpoint": "/auth/disconnect",
    "login_url": "/",
    "modes": {
      "active": {
        "supports_use_other_account": false,
      },
      "passive": {
        "supports_use_other_account": false,
      }
    },
    "branding": {
      "icons": [{
        "url": "https://cdn.glitch.global/4cc67ace-0a9a-430e-a071-8f05043f83de/idp-2-logo.png?v=1744206327848",
        "size": 512,
      }]
    }
  });
});

app.use('/auth', auth);

// dylancutler@ added to allow for cross-site Clear-Site-Data.
app.get('/clear-site-data', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://fedcm-multi-idp-rp.glitch.me');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Clear-Site-Data', '"*"');
  res.status(200).end();
});

// listen for req :)
const port = process.env.GLITCH_DEBUGGER ? null : 8080;
const listener = app.listen(port || process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});

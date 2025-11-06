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
 *
 *
 * NOTE: This is not an officially supported Google product
 */
require("dotenv").config();
const path = require("path");
const fs = require('fs');
const express = require("express");
const session = require("express-session");
// const LowdbStore = require('lowdb-session-store')(session);
const hbs = require("hbs");
const auth = require("./libs/auth");
const { sessionCheck } = require("./libs/common");
const app = express();
const isDevelopmentEnvironment = process.env.DEV_ENV;
const CODE_SOURCE = process.env.CODE_SOURCE;

app.set("view engine", "html");

hbs.registerHelper("isEqual", (value1, value2, options) => {
  if (value1 === value2) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

app.engine("html", hbs.__express);
app.engine("js.hbs", hbs.__express);

// Set up multiple view directories
app.set("views", [
  path.join(__dirname, "views"), // For your .html templates
  path.join(__dirname, "public"), // For your .js.hbs template
]);
app.set("view engine", "html");
// app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(
  express.static(path.join(__dirname, "public"), {
    setHeaders: (res) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET");
    },
  })
);
app.use(express.static(path.join(__dirname, "dist")));
app.use(
  session({
    secret: "secret", // You should specify a real secret here
    resave: true,
    saveUninitialized: false,
    proxy: true,
    // store: new LowdbStore(db),
    cookie: {
      httpOnly: true,
      // In dev environment you may be running the code on localhost, so we need to enable cookies via HTTP
      secure: !isDevelopmentEnvironment,
      // SameSite='none' requires a cookie to be secure, which is not the case in dev environment
      sameSite: isDevelopmentEnvironment ? "lax" : "none",
      maxAge: 31536000000,
    },
  })
);

app.use((req, res, next) => {
  if (process.env.PROJECT_DOMAIN) {
    process.env.HOSTNAME = `${process.env.PROJECT_DOMAIN}.glitch.me`;
  } else {
    process.env.HOSTNAME = req.headers.host;
  }
  const protocol = /^localhost/.test(process.env.HOSTNAME) ? "http" : "https";
  process.env.ORIGIN = `${protocol}://${process.env.HOSTNAME}`;
  if (
    req.get("x-forwarded-proto") &&
    req.get("x-forwarded-proto").split(",")[0] !== "https"
  ) {
    return res.redirect(301, process.env.ORIGIN);
  }
  req.schema = "https";
  return next();
});

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (req, res) => {
  let back = req.query.back;
  if (!back || back === "null" || back === "undefined") {
    back = process.env.RP_URL;
  }

  if (req.session.username && req.session["signed-in"]) {
    return res.redirect(307, `/home?back=${back}`);
  }
  // Check session
  if (req.session.username) {
    // If the user is signed in, redirect to `/reauth`.
    return res.redirect(302, `/reauth?back=${back}`);
  }
  // If user is not signed in, show `index.html` with id/password form.
  const ot_token = process.env.OT_TOKEN;
  res.render("index.html", { ot_token, code_source: CODE_SOURCE });
});

app.get("/authorization", (req, res) => {
  let back = req.query.back;
  if (!back || back === "null" || back === "undefined") {
    back = process.env.RP_URL;
  }

  if (!req.session.username || !req.session["signed-in"]) {
    // If the user is not signed in, redirect to `/`.
    return res.redirect(307, "/");
  }
  const ot_token = process.env.OT_TOKEN;
  res.render("authorization.html", { ot_token, code_source: CODE_SOURCE  });
});

app.get("/iframe", (req, res) => {
  const user = res.locals.user;

  res.render("iframe.html", { 
    rp_origin: process.env.RP_URL,
    idp_1_origin: process.env.IDP1_URL,
    idp_2_origin: process.env.IDP2_URL,
    user_info: user,
    code_source: CODE_SOURCE 
   });
});

app.get("/home", sessionCheck, (req, res) => {
  const user = res.locals.user;
  let back = req.query.back;
  if (!back || back === "null" || back === "undefined") {
    back = process.env.RP_URL;
  }
  // `home.html` shows sign-out link
  res.render("home.html", {
    username: req.session.username,
    approved_clients: user.approved_clients,
    given_name: user.given_name || "new_given_name",
    family_name: user.family_name || "new_family_name",
    picture: user.picture || "",
    backURL: back,
    statuses: [
      {
        value: "signed_in",
        string: "Signed In",
      },
      {
        value: "session_expired",
        string: "Session Expired",
      },
      {
        value: "invalid_request",
        string: "Invalid Request",
      },
      {
        value: "unauthorized_client",
        string: "Unauthorized Client",
      },
      {
        value: "access_denied",
        string: "Access Denied",
      },
      {
        value: "server_error",
        string: "Server Error",
      },
      {
        value: "temporarily_unavailable",
        string: "Temporarily Unavailable",
      },
    ],
    status: user?.status || "signed_in",
    demo_account: user.username === "demo@example.com",
    code_source: CODE_SOURCE
  });
});

app.get("/reauth", (req, res) => {
  let back = req.query.back;
  if (!back || back === "null" || back === "undefined") {
    back = process.env.RP_URL;
  }

  const username = req.session.username;
  if (!username) {
    return res.redirect(307, "/");
  }
  // Show `reauth.html`.
  // User is supposed to enter a password (which will be ignored)
  // Make XHR POST to `/signin`
  res.render("reauth.html", {
    username,
    statuses: [
      {
        value: "signed_in",
        string: "Signed In",
      },
      {
        value: "session_expired",
        string: "Session Expired",
      },
      {
        value: "invalid_request",
        string: "Invalid Request",
      },
      {
        value: "unauthorized_client",
        string: "Unauthorized Client",
      },
      {
        value: "access_denied",
        string: "Access Denied",
      },
      {
        value: "server_error",
        string: "Server Error",
      },
      {
        value: "temporarily_unavailable",
        string: "Temporarily Unavailable",
      },
    ],
    status: req.body.status || "signed_in",
    code_source: CODE_SOURCE
  });
});

app.get("/.well-known/web-identity", (req, res) => {
  console.log("/.well-known/web-identity");
  return res.json({
    provider_urls: [`${process.env.IDP1_URL}/fedcm.json`],
    accounts_endpoint: "/auth/accounts",
    login_url: "/",
  });
});

app.get("/fedcm.json", (req, res) => {
  console.log("loading /fedcm.json...");

  return res.json({
    accounts_endpoint: "/auth/accounts",
    client_metadata_endpoint: "/auth/metadata",
    id_assertion_endpoint: "/auth/idtokens",
    disconnect_endpoint: "/auth/disconnect",
    login_url: "/",
    modes: {
      active: {
        supports_use_other_account: true,
      },
      // ,"passive": {
      //   "supports_use_other_account": true,
      // }
    },
    branding: {
      background_color: "#6200ee",
      color: "#ffffff",
      icons: [
        {
          url: "https://cdn.glitch.global/4673feef-8c3a-4ea6-91b5-aad78b1d7251/idp-logo-512.png?v=1713514252268",
          size: 512,
        },
      ],
    },
  });
});

app.get("/fedcm.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Set-cookie", "test");
  return res.sendFile(path.join(__dirname, "public", "fedcm.js"), {
    idp_origin: process.env.IDP1_URL,
  });
});

app.get("/client.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Set-cookie", "test");
  return res.sendFile(path.join(__dirname, "public", "client.js"), {
    idp_origin: process.env.IDP1_URL,
    rp_origin: process.env.RP_URL,
  });
});

app.get("/client-metadata-static.json", (req, res) => {
  console.log("loading /client-metadata-static.json...");

  return res.json({
    terms_of_service_url: `${process.env.IDP1_URL}/terms_of_service.html`,
    brand_icon_url:
      "https://cdn.glitch.global/32bb3785-b985-4733-a2b1-2dfc919d2250/shrine.png?v=1721700610752",
    client_matches_top_frame_origin: true,
    icons: [
      {
        url: "https://cdn.glitch.global/32bb3785-b985-4733-a2b1-2dfc919d2250/shrine.png?v=1721700610752",
        size: 40,
      },
    ],
  });
});

app.use("/auth", auth);

// dylancutler@ added to allow for cross-site Clear-Site-Data.
app.get("/clear-site-data", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.RP_URL);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Clear-Site-Data", '"*"');
  res.status(200).end();
});

// listen for req :)
const port = process.env.IDP1_PORT || 8080;
const host = process.env.HOST || '0.0.0.0';
const listener = app.listen(port, host, () => {
  console.log("Your app is listening on port " + listener.address().port);
  const dbPath = path.join(__dirname, '.data', 'db.json');
  console.log('dbPath: ', dbPath);
  if (fs.existsSync(dbPath)) {
    try {
    // Read the file content as a UTF-8 string
    const dbContent = fs.readFileSync(dbPath, 'utf8');
    
    // Log the content
    console.log('[STARTUP CHECK] ✅ Database file was found. Content:');
    console.log(dbContent);

    } catch (err) {
      console.error('[STARTUP CHECK] 🔥 CRITICAL: Database file found but could not be read!', err);
    }
  } else {
    console.error('[STARTUP CHECK] ❌: User Database file was NOT found!');
  }
});

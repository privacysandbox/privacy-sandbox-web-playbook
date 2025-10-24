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
require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");
const hbs = require("hbs");
const jwt = require("jsonwebtoken");
const { csrfCheck, sessionCheck, getUser } = require("./libs/common");
const app = express();

app.set("view engine", "html");
app.engine("html", hbs.__express);
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "dist")));
app.use(
  session({
    secret: "secret", // You should specify a real secret here
    resave: true,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: true,
    },
  })
);

const IDP_ORIGIN = process.env.IDP1_URL;
const IDP2_ORIGIN = process.env.IDP2_URL;
const CLIENT_ID = process.env.RP_URL;
const CODE_SOURCE = process.env.CODE_SOURCE;


app.use((req, res, next) => {
  if (process.env.PROJECT_DOMAIN) {
    process.env.HOSTNAME = process.env.IDP1_URL;
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
  next();
});

app.post("/verify", csrfCheck, (req, res) => {
  const { token: raw_token, multi_idp } = req.body;

  try {
    const nonce = req.session.nonce.toString();

    // Determine the valid issuer(s) for the token.
    let validIssuers = [IDP_ORIGIN];
    if (multi_idp) {
      validIssuers.push(IDP2_ORIGIN);
    }

    const token = jwt.verify(raw_token, "xxxxx", {
      issuer: validIssuers,
      nonce,
      audience: CLIENT_ID,
    });
    
    const user = getUser(token.sub, token.email, token.name, token.picture);

    req.session.user_id = user.user_id;
    req.session.username = user.username;
    req.session.name = user.name;
    req.session.picture = user.picture;
    res.status(200).json(user);
  } catch (e) {
    console.error(e.message);
    res.status(401).json({ error: "ID token verification failed." });
  }
});

app.get("/signout", (req, res) => {
  req.session.destroy();
  res.redirect(307, "/");
});

app.get("/home", sessionCheck, (req, res) => {
  const user = res.locals.user;
  res.render("home.html", {
    user_id: user.user_id,
    username: user.username,
    name: user.name,
    picture: user.picture,
    code_source: CODE_SOURCE,
  });
});

app.get("/", (req, res) => {
  const nonce = Math.floor(Math.random() * 10e10);
  // TODO: Shouldn't I timeout this?
  req.session.nonce = nonce;
  const client_id = CLIENT_ID;
  const idp_origin = IDP_ORIGIN;
  res.render("index.html", 
    { nonce,
      client_id,
      idp_origin,
      code_source: CODE_SOURCE,
    });
});

app.get("/multi-idp", (req, res) => {
  const nonce = Math.floor(Math.random() * 10e10);
  req.session.nonce = nonce;
  const client_id = CLIENT_ID;
  const idp_origin = IDP_ORIGIN;
  const idp2_origin = IDP2_ORIGIN;
  res.render("index.html", {
    nonce,
    client_id,
    idp_origin,
    idp2_origin,
    multi_idp: true,
    code_source: CODE_SOURCE,
  });
});

app.get("/alternative-fields", (req, res) => {
  const nonce = Math.floor(Math.random() * 10e10);
  req.session.nonce = nonce;
  const client_id = CLIENT_ID;
  const idp_origin = IDP_ORIGIN;
  res.render("alternative-fields.html", {
    // TODO: wrap the IdP origin to config file
    nonce,
    client_id,
    idp_origin,
    code_source: CODE_SOURCE
  });
});

app.get("/active-mode", (req, res) => {
  const nonce = Math.floor(Math.random() * 10e10);
  // TODO: Shouldn't I timeout this?
  req.session.nonce = nonce;
  const client_id = CLIENT_ID;
  const idp_origin = IDP_ORIGIN;
  res.render("active-mode.html", { nonce, client_id, idp_origin, code_source: CODE_SOURCE, });
});

app.get("/authorization", (req, res) => {
  const nonce = Math.floor(Math.random() * 10e10);
  // TODO: Shouldn't I timeout this?
  req.session.nonce = nonce;
  const client_id = CLIENT_ID;
  const idp_origin = IDP_ORIGIN;
  res.render("authorization.html", { nonce, client_id, idp_origin,  code_source: CODE_SOURCE});
});

app.get("/domain-hint", (req, res) => {
  const nonce = Math.floor(Math.random() * 10e10);
  req.session.nonce = nonce;
  const client_id = CLIENT_ID;
  const idp_origin = IDP_ORIGIN;
  res.render("domain-hint.html", { nonce, client_id, idp_origin, code_source: CODE_SOURCE,});
});

app.get("/domain-hint-passive", (req, res) => {
  const nonce = Math.floor(Math.random() * 10e10);
  req.session.nonce = nonce;
  const client_id = CLIENT_ID;
  const idp_origin = IDP_ORIGIN;
  const idp2_origin = IDP2_ORIGIN;

  res.render("domain-hint-passive.html", {
    nonce,
    client_id,
    idp_origin,
    idp2_origin,
    multi_idp: true,
    code_source: CODE_SOURCE,
  });
});

/*
 * Demonstrates the behavior when FedCM is called from within a third-party iframe embedded on the RP 
 */
app.get("/iframe", (req, res) => {
  const nonce = Math.floor(Math.random() * 10e10);
  req.session.nonce = nonce;
  const idp2_origin = IDP2_ORIGIN;

  res.render("iframe.html", {
    nonce,
    idp2_origin,
  });
});

app.get("/button", (req, res) => {
  const nonce = Math.floor(Math.random() * 10e10);
  // TODO: Shouldn't I timeout this?
  req.session.nonce = nonce;
  const client_id = CLIENT_ID;
  const idp_origin = IDP_ORIGIN;
  res.render("button.html", { nonce, client_id, idp_origin,  code_source: CODE_SOURCE,});
});

app.get("/menu", (req, res) => {
  res.render("menu", {
    idp_origin: process.env.IDP1_URL,
    idp2_origin: process.env.IDP2_URL,
    code_source: process.env.CODE_SOURCE,
  });
});

const port = 8080;
const listener = app.listen(port || process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

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

const IDP_ORIGIN = "https://fedcm-idp-demo.glitch.me";
const CLIENT_ID = "https://fedcm-rp-demo.glitch.me";

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
  next();
});

app.post("/verify", csrfCheck, (req, res) => {
  const raw_token = req.body.token;
  // console.error(raw_token);

  try {
    const nonce = req.session.nonce.toString();

    const token = jwt.verify(raw_token, "xxxxx", {
      issuer: IDP_ORIGIN,
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
  });
});

app.get("/", (req, res) => {
  const nonce = Math.floor(Math.random() * 10e10);
  // TODO: Shouldn't I timeout this?
  req.session.nonce = nonce;
  const client_id = CLIENT_ID;
  res.render("index.html", { nonce, client_id });
});

app.get("/button_flow", (req, res) => {
  const nonce = Math.floor(Math.random() * 10e10);
  // TODO: Shouldn't I timeout this?
  req.session.nonce = nonce;
  const client_id = CLIENT_ID;
  res.render("button_flow.html", { nonce, client_id });
});

app.get("/authorization", (req, res) => {
  const nonce = Math.floor(Math.random() * 10e10);
  // TODO: Shouldn't I timeout this?
  req.session.nonce = nonce;
  const client_id = CLIENT_ID;
  res.render("authorization.html", { nonce, client_id });
});

app.get("/domain-hint", (req, res) => {
  const nonce = Math.floor(Math.random() * 10e10);
  req.session.nonce = nonce;
  const client_id = CLIENT_ID;
  res.render("domain-hint.html", { nonce, client_id });
});

app.get("/domain-hint-passive", (req, res) => {
  const nonce = Math.floor(Math.random() * 10e10);
  // TODO: Shouldn't I timeout this?
  req.session.nonce = nonce;
  const client_id = CLIENT_ID;
  res.render("domain-hint-passive.html", { nonce, client_id });
});

app.get("/button", (req, res) => {
  const nonce = Math.floor(Math.random() * 10e10);
  // TODO: Shouldn't I timeout this?
  req.session.nonce = nonce;
  const client_id = CLIENT_ID;
  res.render("button.html", { nonce, client_id });
});

const port = process.env.GLITCH_DEBUGGER ? null : 8080;
const listener = app.listen(port || process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
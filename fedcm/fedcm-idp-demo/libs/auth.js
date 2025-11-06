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
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const fido2 = require("@simplewebauthn/server");
const { apiSessionCheck } = require("./common");
const base64url = require("base64url");
const md5 = require("blueimp-md5");
const jwt = require("jsonwebtoken");
const {
  getUser,
  getUserById,
  addUser,
  updateCredentials,
  resetUsers,
} = require("./db");
const cors = require("cors");

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(
  cors({
    origin: true,
    credentials: true,
  })
);

const RP_NAME = "WebAuthn Codelab";
const TIMEOUT = 30 * 1000 * 60; // 30 minutes
const IDTOKEN_LIFETIME = 1000 * 60 * 60 * 24; // 24 hours
const ORIGIN = process.env.IDP1_URL;
const RP_CLIENT_ID = process.env.RP_URL;
const RP_ORIGIN = process.env.RP_URL;
const RP_MULTI_IDP_CLIENT_ID = "https://fedcm-multi-idp-rp.glitch.me";
const RP_MULTI_IDP_ORIGIN = "https://fedcm-multi-idp-rp.glitch.me/";
const IDP2_ORIGIN= process.env.IDP2_URL;

const RP_CLIENT_IDS = [
  RP_CLIENT_ID,
  RP_MULTI_IDP_CLIENT_ID,
  "http://localhost:8080",
  "https://project-sesame-426206.appspot.com",
  "https://identity-demos.dev",
  IDP2_ORIGIN
];

const csrfCheck = (req, res, next) => {
  if (
    req.header("X-Requested-With") === "XMLHttpRequest" ||
    req.header("Sec-Fetch-Dest") === "webidentity"
  ) {
    next();
  } else {
    return res.status(400).json({ error: "Invalid access." });
  }
};

const getOrigin = (userAgent) => {
  let origin = process.env.ORIGIN;

  const appRe = /^[a-zA-z0-9_.]+/;
  const match = userAgent.match(appRe);
  if (match) {
    // Check if UserAgent comes from a supported Android app.
    if (process.env.ANDROID_PACKAGENAME && process.env.ANDROID_SHA256HASH) {
      const package_names = process.env.ANDROID_PACKAGENAME.split(",").map(
        (name) => name.trim()
      );
      const hashes = process.env.ANDROID_SHA256HASH.split(",").map((hash) =>
        hash.trim()
      );
      const appName = match[0];
      for (let i = 0; i < package_names.length; i++) {
        if (appName === package_names[i]) {
          // We recognize this app, so use the corresponding hash.
          const octArray = hashes[i].split(":").map((h) => parseInt(h, 16));
          const androidHash = base64url.encode(octArray);
          origin = `android:apk-key-hash:${androidHash}`;
          break;
        }
      }
    }
  }

  return origin;
};

/**
 * Check username, create a new account if it doesn't exist.
 * Set a `username` in the session.
 **/
router.post("/username", (req, res) => {
  const username = req.body.username;
  // Only check username, no need to check password as this is a mock
  if (!username || !/[a-zA-Z0-9-_]+/.test(username)) {
    res.status(400).send({ error: "Bad request" });
    return;
  } else {
    // See if account already exists
    let user = getUser(username);
    // If user entry is not created yet, create one
    if (!user) {
      console.log("Adding new user...");
      const picture = new URL("https://www.gravatar.com/");
      picture.pathname = `/avatar/${md5(username)}`;
      // TODO: replace with better initial user data
      user = {
        username: username,
        email: username,
        id: base64url.encode(crypto.randomBytes(32)),
        given_name: "new_given_name",
        family_name: "new_family_name",
        picture: picture.toString(),
        approved_clients: [],
        credentials: [],
        status: user?.status ?? "signed_in" ,
      };
      addUser(user);
    }
    // Set username in the session
    req.session.username = username;
    // If sign-in succeeded, redirect to `/home`.
    res.json(user);
  }
});

/**
 * Verifies user credential and let the user sign-in.
 * No preceding registration required.
 * This only checks if `username` is not empty string and ignores the password.
 **/
router.post("/password", (req, res) => {
  if (!req.body.password) {
    return res.status(401).json({ error: "Enter at least one random letter." });
  }
  const user = getUser(req.session.username);

  if (!user) {
    return res.status(401).json({ error: "Enter username first." });
  }

  user.status = req.body.status || "signed_in";

  addUser(user);

  req.session["signed-in"] = true;
  // Notify the browser about user login status with Login Status API
  res.set("Set-Login", "logged-in");
  res.json(user);
});


/**
 * Updates user account information such as name, picture, and status.
 * This is called from the user's profile page on the IdP.
 **/
router.post("/account", csrfCheck, apiSessionCheck, (req, res) => {
  const user = res.locals.user;

  if (
    user.username !== "demo@example.com" &&
    (!/[0-9a-zA-Z-_]{0,12}/.test(req.body.given_name) ||
      !/[0-9a-zA-Z-_]{0,12}/.test(req.body.family_name) ||
      !/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.test(
        req.body.picture
      ))
  ) {
    return res.status(400).json({ error: "Bad Request" });
  }

  if (req.body.status === "session_expired") {
    // Terminate the session here without sending a Login Status
    // This will trigger a mismatch UI, since the browser hasn't been notified about the user's login status
    req.session.destroy();
    return res.status(200);
  }

  if (user.username === "demo@example.com") {
    user.status = req.body.status || "";
  } else {
    user.given_name = req.body.given_name || "";
    user.family_name = req.body.family_name || "";
    user.picture = req.body.picture || "";
    user.status = req.body.status || "";
  }

  addUser(user);

  console.log("/account", user);
  return res.json(user);
});

router.get("/signout", (req, res) => {
  console.log("/auth/signout");

  let back = req.query.back;
  if (!back) {
    back = process.env.RP_URL;
  }

  // Remove the session
  req.session.destroy();
  res.set("Set-Login", "logged-out");
  // Redirect to `/`
  res.redirect(307, "/" + (back ? `?back=${back}` : ""));
});

router.get("/accounts", csrfCheck, apiSessionCheck, (req, res) => {
  console.log("/auth/accounts");

  const user = res.locals.user;

  if (user.status === "session_expired") {
    return res.status(401).json({ error: "not signed in." });
  }
  
  if (user.username === "multiple-accounts") {
    const user2 = getUser("agektmr");
    const user3 = getUser("john.doe");
    return res.json({
      accounts: [
        {
          id: user.id,
          given_name: user.given_name,
          name: `${user.given_name} ${user.family_name}`,
          email: user.username,
          picture: user.picture,
          login_hints: [user.username],
          approved_clients: user.approved_clients,
        },
        {
          id: user2.id,
          given_name: user2.given_name,
          name: `${user2.given_name} ${user2.family_name}`,
          email: user2.username,
          picture: user2.picture,
          login_hints: [user2.username],
          approved_clients: user2.approved_clients,
        },
        {
          id: user3.id,
          given_name: user3.given_name,
          name: `${user3.given_name} ${user3.family_name}`,
          email: user3.username,
          picture: user3.picture,
          login_hints: [user3.username],
          approved_clients: user3.approved_clients,
        },
      ],
    });
  }

  if (user.username.includes("@allowed-domain.example")) {
    const responseData = {
      accounts: [
        {
          id: user.id,
          given_name: user.given_name,
          name: `${user.given_name} ${user.family_name}`,
          email: user.email,
          picture: user.picture,
          // login_hints: [user.username],
          approved_clients: user.approved_clients,
          domain_hints: ["allowed-domain.example"],
        },
      ],
    };
    // console.log(responseData.accounts[0].approved_clients);
    return res.json(responseData);
  } else {
    if (!user.given_name && !user.family_name) {
      return res
        .status(400)
        .json({
          error:
            "Account name cannot be empty. Return a `name` parameter in accounts endpoint",
        });
    }
    try {
      const existingUser = getUser(user.username);
      const responseData = {
      accounts: [
        {
          id: existingUser.id,
          given_name: existingUser.given_name,
          name: `${existingUser.given_name} ${existingUser.family_name}`,
          email: existingUser.email,
          username: existingUser.username,
          tel: existingUser.tel,
          picture: existingUser.picture,
          // login_hints: [user.username],
          approved_clients: existingUser.approved_clients,
        },
      ],
    };
      return res.json(responseData);
    } catch (e) {
      console.log("User not found: ", e);
    }
    const responseData = {
      accounts: [
        {
          id: user.id,
          given_name: user.given_name,
          name: `${user.given_name} ${user.family_name}`,
          email: user.email,
          username: user.username,
          tel: user.tel,
          picture: user.picture,
          // login_hints: [user.username],
          approved_clients: user.approved_clients,
        },
      ],
    };
    // console.log(responseData.accounts[0].approved_clients);
    return res.json(responseData);
  }
});

router.get("/metadata", (req, res) => {
  console.log("/auth/metadata");

  const clientIsThirdParty = req.query.client_id && req.query.top_frame_origin 
    && req.query.client_id !== req.query.top_frame_origin;

  return res.json({
    privacy_policy_url: `${RP_ORIGIN}/privacy_policy.html`,
    terms_of_service_url: `${RP_ORIGIN}/terms_of_service.html`,
    client_is_third_party_to_top_frame_origin: clientIsThirdParty,
    icons: [
      {
        // Logo icons can be configured depending on the RP (on the client_id)
        url: "https://cdn.glitch.global/1156bf10-8b7b-4c1a-91ec-6d46c61eae85/pets_40dp_CEA8BC_FILL0_wght400_GRAD0_opsz40.png?v=1721774712421",
        size: 40,
      },
    ],
  });
});

// dylancutler@ added to set up a second RP test site.
const isValidOrigin = (originStr) => {
  // console.log("originStr", originStr);
  try {
    const origin = new URL(originStr).origin;
    return (
      origin === new URL(RP_ORIGIN).origin ||
      origin === new URL(IDP2_ORIGIN).origin ||
      origin === new URL(RP_MULTI_IDP_ORIGIN).origin ||
      origin === new URL("http://localhost:8080").origin ||
      origin === new URL("https://project-sesame.googleplex.com/").origin ||
      origin === new URL("https://project-sesame-426206.appspot.com/").origin ||
      origin ===
        new URL("https://dev-dot-project-sesame.googleplex.com/").origin ||
      origin ===
        new URL("https://luminous-accurate-parenthesis.glitch.me/").origin
    );
  } catch (e) {
    return false;
  }
};

router.post("/token", csrfCheck, apiSessionCheck, (req, res) => {

  const { client_id, nonce } = req.body;
  let user = res.locals.user;

  if (user.status === "") {
    const token = jwt.sign(
      {
        iss: process.env.ORIGIN,
        sub: user.id,
        aud: client_id,
        nonce,
        exp: new Date().getTime() + IDTOKEN_LIFETIME,
        iat: new Date().getTime(),
        name: `${user.given_name} ${user.family_name}`,
        email: user.username,
        given_name: user.given_name,
        family_name: user.family_name,
        picture: user.picture,
      },
      "xxxxx"
    );

    // console.log(`/token returns "token": "${token}"`);
    return res.json({ token });
  } else {
    let error_code = 401;
    switch (user.status) {
      case "server_error":
        error_code = 500;
        break;
      case "temporarily_unavailable":
        error_code = 503;
        break;
      default:
        error_code = 401;
    }
    return res.status(error_code);
  }
});

router.post("/idtokens", csrfCheck, apiSessionCheck, (req, res) => {
  const {
    client_id,
    account_id,
    consent_acquired,
    disclosure_text_shown,
    params,
  } = req.body;

  let user = res.locals.user;

  let scope;
  let nonce;

  try {
    const paramsObject = JSON.parse(params);
    scope = paramsObject.scope;
    nonce = paramsObject.nonce;
  } catch (error) {
    console.error("Error parsing params:", error);
  }

  if (user.username === "multiple-accounts") {
    user = getUserById(account_id);
  }

  const currentOrigin = new URL(req.headers.origin)
    .toString()
    .replace(/\/$/, "");

  // If the user did not consent or the account does not match who is currently signed in, return error.
  if (
    !RP_CLIENT_IDS.includes(client_id) ||
    account_id !== user.id ||
    !isValidOrigin(currentOrigin)
  ) {
    console.error("Invalid request.", req.body);
    return res.status(400).json({ error: "Invalid request." });
  }

  if (
    (consent_acquired === "true" || disclosure_text_shown === "true") &&
    !user.approved_clients.includes(currentOrigin)
  ) {
    // console.log("The user is registering to the RP.");
    user.approved_clients.push(currentOrigin);
    addUser(user);
  } else {
    // console.log("The user is signing in to the RP.");
  }

  if (user.status === "signed_in") {
    const token = jwt.sign(
      {
        iss: process.env.ORIGIN,
        sub: user.id,
        aud: client_id,
        nonce,
        exp: new Date().getTime() + IDTOKEN_LIFETIME,
        iat: new Date().getTime(),
        name: `${user.given_name} ${user.family_name}`,
        email: user.username,
        given_name: user.given_name,
        family_name: user.family_name,
        picture: user.picture,
      },
      "xxxxx"
    );

    console.log(
      "Checking if RP specified any additional required permissions in scope: ",
      params
    );

    if (params) {
      const paramsObject = JSON.parse(params);
    }

    if (scope) {
      // console.log("/idtokens returns `continue_on`");
      return res.json({
        continue_on: `/authorization?client_id=${client_id}&scope=${scope}&nonce=${params.nonce}`,
      });
    }

    return res.json({
      token,
    });
  } else {
    let error_code = 401;
    switch (user.status) {
      case "server_error":
        error_code = 500;
        break;
      case "temporarily_unavailable":
        error_code = 503;
        break;
      default: {
        console.log("User status ", user.status, " is invalid");
        error_code = 401;
      }
    }
    return res.status(error_code).json({
      error: {
        code: user.status,
        url: `${ORIGIN}/error.html&type=${user.status}`,
      },
    });
  }
});

router.post("/authorize", csrfCheck, apiSessionCheck, (req, res) => {});

router.post("/disconnect", csrfCheck, apiSessionCheck, (req, res) => {
  const { account_hint, client_id } = req.body;
  const { clientId } = req.body;

  const user = res.locals.user;
  console.log("Allowed RPs before disconnecting: ", user.approved_clients);

  if (user.id === account_hint && RP_CLIENT_IDS.includes(client_id)) {
    try {
      // Remove current client from allowed RPs
      user.approved_clients = user.approved_clients.filter(
        (client) => !client.includes(client_id)
      );
      addUser(user);
      console.log("The user revoked access.", user);
      console.log("Allowed RPs after disconnecting: ", user.approved_clients);
      return res.json({ account_id: user.id });
    } catch (e) {
      console.log(e);
      return res.status(400).json({ error: "Invalid request." });
    }
  } else {
    return res.status(400).json({ error: "Invalid request." });
  }
});

module.exports = router;

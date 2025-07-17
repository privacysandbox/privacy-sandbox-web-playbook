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
const low = require('lowdb');
const fs = require('fs');

if (!fs.existsSync('./.data')) {
  fs.mkdirSync('./.data');
}

const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('.data/db.json');
const db = low(adapter);

function csrfCheck(req, res, next) {
  if (req.header('X-Requested-With') === 'XMLHttpRequest' ||
      req.header('Sec-FedCM-CSRF') === '?1') {
    next();
  } else {
    return res.status(400).json({ error: 'Invalid access.' });
  }
};

/**
 * Checks CSRF protection using custom header `X-Requested-With`
 * If the session doesn't contain `signed-in`, consider the user is not authenticated.
 **/
function sessionCheck(req, res, next) {
  if (!req.session.user_id) {
    res.status(401).json({ error: 'not signed in.' });
    return;
  }
  const user = db.get('users').find({ user_id: req.session.user_id }).value();
  if (!user) {
    return res.status(401).json({ error: 'User not found.' });
  }
  res.locals.user = user;

  next();
};

function getUser(user_id, username = '', name = '', picture = '') {
    // See if account already exists
  let user = db.get('users').find({ user_id }).value();
  // If user entry is not created yet, create one
  if (!user) {
    user = {
      user_id,
      username,
      name,
      picture
    };
    db.get('users').push(user).write();
  }
  return user;
}

module.exports = { csrfCheck, sessionCheck, getUser };

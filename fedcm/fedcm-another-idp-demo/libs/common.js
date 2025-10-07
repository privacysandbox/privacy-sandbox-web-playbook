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
const { getUser, getUserById, addUser } = require('./db');

/**
 * Checks CSRF protection using custom header `X-Requested-With`
 * If the session doesn't contain `signed-in`, consider the user is not authenticated.
 **/
const sessionCheck = (req, res, next) => {
  if (!req.session['signed-in']) {
    return res.redirect(307, '/');
  }
  const user = getUser(req.session.username);
  if (!user) {
    return res.redirect(307, '/');
  }
  res.locals.user = user;

  next();
};

const apiSessionCheck = (req, res, next) => {
  if (!req.session['signed-in']) {
    return res.status(401).json({ error: 'not signed in.' });
  }
  const user = getUser(req.session.username);
  console.log('user:', user);
  if (!user) {
    return res.status(401).json({ error: 'User not found.' });
  }
  res.locals.user = user;

  next();
};

function csrfCheck(req, res, next) {
  if (req.header('X-Requested-With') === 'XMLHttpRequest' ||
      req.header('Sec-FedCM-CSRF') === '?1') {
    next();
  } else {
    return res.status(400).json({ error: 'Invalid access.' });
  }
};

function getOrCreateUser(user_id, username = '', name = '', picture = '') {
  // See if account already exists
  let user = getUserById(user_id);
  // If user entry is not created yet, create one
  if (!user) {
    user = {
      user_id,
      username,
      name,
      picture
    };
    addUser(user);
  }
  return user;
}

module.exports = { sessionCheck, apiSessionCheck, csrfCheck, getOrCreateUser };

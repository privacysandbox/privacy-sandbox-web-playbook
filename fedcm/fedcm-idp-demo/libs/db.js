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
let db;
(async () => {
  const { LowSync, JSONFileSync } = await import("lowdb");
  const fs = require("fs");

  if (!fs.existsSync("./.data")) {
    fs.mkdirSync("./.data");
  }

  db = new LowSync(new JSONFileSync(".data/db.json"));

  db.read();
  if (!db.data) {
    db.data = { users: [] };
    db.write();
  }

  if (!db.data.users) {
    db.data.users = [];
    db.write();
  }
})();

const getUser = (username) => {
  db.read();
  return db.data.users.find((user) => user.username === username);
};

const getUserById = (id) => {
  db.read();
  return db.data.users.find((user) => user.id === id);
};

const addUser = (user) => {
  db.read();
  const _user = getUser(user.username);
  if (_user) {
    Object.assign(_user, user);
  } else {
    db.data.users.push(user);
  }
  db.write();
};

const updateCredentials = (username, newCreds) => {
  const user = getUser(username);
  if (user) {
    user.credentials = newCreds;
    db.write();
    return true;
  }
  return false;
};

const resetUsers = () => {
  db.read();
  db.data.users = [];
  db.write();
};

module.exports = {
  getUser,
  getUserById,
  addUser,
  updateCredentials,
  resetUsers,
};

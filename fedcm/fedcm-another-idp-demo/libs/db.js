let db;
(async () => {
  const { LowSync, JSONFileSync } = await import('lowdb');
  const fs = require('fs');

  if (!fs.existsSync('./.data')) {
    fs.mkdirSync('./.data');
  }

  db = new LowSync(new JSONFileSync('.data/db.json'));

  db.read();
  if (!db?.data?.users) {
    db.data.users = [];
    db.write();
  }
})();

const getUser = (username) => {
  db.read();
  return db.data.users.find(user => user.username === username);
}

const getUserById = (id) => {
  db.read();
  return db.data.users.find(user => user.id === id);
}

const addUser = (user) => {
  db.read();
  const _user = getUser(user.username);
  if (_user) {
    Object.assign(_user, user);
  } else {
    db.data.users.push(user);
  }
  db.write();
}

const updateCredentials = (username, newCreds) => {
  const user = getUser(username);
  if (user) {
    user.credentials = newCreds;
    db.write();
    return true;
  }
  return false
}

const resetUsers = () => {
  db.read();
  db.data.users = [];
  db.write();
}

module.exports = { getUser, getUserById, addUser, updateCredentials, resetUsers };

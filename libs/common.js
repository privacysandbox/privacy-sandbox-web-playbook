const { getUser } = require('./db');

/**
 * Checks CSRF protection using custom header `X-Requested-With`
 * If the session doesn't contain `signed-in`, consider the user is not authenticated.
 **/
const sessionCheck = (req, res, next) => {
  console.log('session:', req.session);
  if (!req.session['signed-in']) {
    return res.redirect(307, '/');
  }
  const user = getUser(req.session.username);
  console.log('user:', user);
  if (!user) {
    return res.redirect(307, '/');
  }
  res.locals.user = user;

  next();
};

const apiSessionCheck = (req, res, next) => {
  console.log('session:', req.session);
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

module.exports = { sessionCheck, apiSessionCheck };

const {cookie_3p} = require('./index.js');

const PORT = process.env.PORT || 8080;
cookie_3p.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

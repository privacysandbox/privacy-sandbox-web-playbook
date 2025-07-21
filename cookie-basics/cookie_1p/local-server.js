const {cookie_1p} = require('./index.js');

const PORT = process.env.PORT || 8080;
cookie_1p.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

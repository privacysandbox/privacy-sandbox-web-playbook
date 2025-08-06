/* Copyright 2025 Google LLC.
SPDX-License-Identifier: Apache-2.0 */

const express = require('express');
const app = express();


app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

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
import { fileURLToPath } from 'url';
import path from 'path';
import got from 'got';
import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import handlebars from 'handlebars';
import fs from 'fs';
import fetch from 'node-fetch';

(async () => {
  const server = fastify({ logger: true });

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  await server.register(fastifyStatic, {
    root: path.join(__dirname, "public"),
    prefix: "/", 
  });

  await server.register(fastifyView, { 
    engine: { 
      handlebars: handlebars 
    } 
  });
  
  const viewParams = {
    theme: 'light',
    index: '0',
    scriptText: '',
    watText: '',
    func: ''
  };
  
  const scriptParams = {
    wasmBytes: ''
  }

  
  function setViewParams(request, func, scriptText='') {
    viewParams.theme = request.query.theme || 'light';
    viewParams.index = request.query.index || '0';
    viewParams.func = func;
    viewParams.scriptText = scriptText;
    console.log(viewParams);
  }
  
  function setScriptText(scriptText) {
    viewParams.scriptText = scriptText;
    console.log(viewParams);
  }
  
  function setWatText(watText) {
    viewParams.watText = watText;
    console.log(viewParams);
  }
  
  function preventCaching(reply) {
    // Headers to prevent caching
    reply.header('Cache-Control', 'no-cache, no-store, must-revalidate'); 
    reply.header('Pragma', 'no-cache'); 
    reply.header('Expires', '0'); 
  }
  
  function setIframeHeaders(reply) {
    reply.header('Content-Type', 'text/html');
    preventCaching(reply);
  }
  
  function setFencedFrameHeaders(reply) {
    reply.header('Content-Type', 'text/html');
    reply.header('Supports-Loading-Mode', 'fenced-frame');
    preventCaching(reply);
  }
  
  function setImgHeaders(reply) {
    reply.header('Content-Type', 'image/webp');
    preventCaching(reply);
  }
  
  async function tryForwardImage(reply, imageUrl) {
    try {
      const response = await got(imageUrl, {responseType: 'buffer' });
      reply.send(response.body);
    } catch (error) {
      console.error('Error fetching image:', error);
      reply.code(500).send('Error fetching image');
    }
  }
  
  function tryForwardScript(reply, scriptUrl) {
    try {
      const data = fs.readFileSync(scriptUrl, 'utf8');
      reply.header('Content-Type', 'text/javascript');
      reply.send(data);
    } catch (error) {
      console.error('Error reading file: ', error);
      return;
    }
  }
  
  function tryForwardScriptAsText(scriptUrl) {
    try {
      const data = fs.readFileSync(scriptUrl, 'utf8');
      console.log(JSON.stringify(data));
      setScriptText(data);
    } catch (error) {
      console.error('Error reading file: ', error);
    }
  }
  
  function tryForwardScriptAsTextResponse(reply, scriptUrl) {
    try {
      const data = fs.readFileSync(scriptUrl, 'utf8');
      reply.header('Content-Type', 'text/plain');
      preventCaching(reply);
      console.log(data);
      reply.send(data);
    } catch (error) {
      console.error('Error reading file: ', error);
      return;
    }
  }
  
  function tryForwardWatAsText(watUrl) {
    try {
      const data = fs.readFileSync(watUrl, 'utf8');
      console.log(JSON.stringify(data));
      setWatText(data);
    } catch (error) {
      console.error('Error reading file: ', error);
    }
  }
  
  async function tryForwardRemoteWatAsText(remoteWatUrl) {
    try {
      const response = await fetch(remoteWatUrl);
      const data = await response.text();
      console.log(JSON.stringify(data));
      setWatText(data);
    } catch (error) {
      console.error('Error fetching WAT file: ', error);
    }
  }
  
  async function tryForwardRemoteWasmBytes(reply, remoteWasmUrl) {
    try {
      const response = await fetch(remoteWasmUrl);
      const buffer = await response.buffer();
      reply.header('Content-Type', 'application/wasm');
      preventCaching(reply);
      console.log('buffer:', buffer)
      reply.send(buffer);
    } catch (error) {
      console.error('error fetching WASM:', error);
      reply.code(500).send({ error: 'Error fetching WASM file' });
    }
  }
  
  // Our main GET home page route, pulls from src/pages/index.hbs
  server.get("/", async (request, reply) => {
    reply.header('Content-Type', 'text/html'); 
    return await reply.view("/src/pages/index.hbs", viewParams);
  });
  
  // Route for our custom code-box tag definition script
  server.get("/code-box", async (request, reply) => {
    tryForwardScript(reply, "public/code-box.js");
  });
  
  // Route for our custom dark mode script
  server.get("/dark-mode", async (request, reply) => {
    tryForwardScript(reply, "public/dark-mode.js");
  });
  
  // Route for our utils script
  server.get("/utils", async (request, reply) => {
    tryForwardScript(reply, "public/utils.js");
  });
  
  // Default document for the page's iframe
  server.get("/default-frame", async (request, reply) => {
    reply.header('Content-Type', 'text/html');
    setViewParams(request, '');
    return await reply.view("/src/pages/default-frame.hbs", viewParams);
  });
  
  // Route for the intermediate iframe "simple.hbs"
  server.get("/simple", async (request, reply) => {
    reply.header('Content-Type', 'text/html'); 
    setViewParams(request, 'simple');
    tryForwardScriptAsText("public/simple-module.js");
    tryForwardWatAsText("public/simple.wat");
    return await reply.view("/src/pages/simple.hbs", viewParams);
  });
  
  // Route to fetch wasm bytes for simple 
  server.get("/get-simple-wasm-bytes", async (request, reply) => {  
    return await tryForwardRemoteWasmBytes(reply, "https://cdn.glitch.global/299277f2-19a3-45d8-8a11-ccbaff9d6682/simple.wasm?v=1712781010165");
  });
  
  // Route for our JS module that imports a wasm function printing to console
  server.get("/simple-module.js", async (request, reply) => {  
    tryForwardScript(reply, "public/simple-module.js");  
  });
  
   // Route for the fenced frame created by script
  server.get('/simple-inner', async (request, reply) => {
    setFencedFrameHeaders(reply);
    setViewParams(request, 'simple');
    return await reply.view("/src/pages/simple-inner.hbs", viewParams);
  });
  
  // Route for the intermediate iframe "add.hbs"
  server.get("/add", async (request, reply) => {
    reply.header('Content-Type', 'text/html'); 
    setViewParams(request, 'add');
    tryForwardScriptAsText("public/add-module.js");
    tryForwardWatAsText("public/add.wat");
    return await reply.view("/src/pages/add.hbs", viewParams);
  });
  
  // Route to fetch wasm bytes for add
  server.get("/get-add-wasm-bytes", async (request, reply) => {  
    return await tryForwardRemoteWasmBytes(reply, "https://cdn.glitch.global/299277f2-19a3-45d8-8a11-ccbaff9d6682/add.wasm?v=1712791043525");
  });
  
  // Route for our JS module that imports a wasm add function
  server.get("/add-module.js", async (request, reply) => {  
    tryForwardScript(reply, "public/add-module.js");  
  });

  // Route for the fenced frame created by script
  server.get('/add-inner', async (request, reply) => {
    setFencedFrameHeaders(reply);
    setViewParams(request, 'add');
    return await reply.view("/src/pages/add-inner.hbs", viewParams);
  });
  
  
  // Route for the intermediate iframe "parsedown.hbs"
  server.get("/parsedown", async (request, reply) => {
    reply.header('Content-Type', 'text/html'); 
    setViewParams(request, 'parsedown');
    tryForwardScriptAsText("public/parsedown-module.js");
    return await reply.view("/src/pages/parsedown.hbs", viewParams);
  });
  
  // Route to fetch wasm bytes for parsedown
  server.get("/get-parsedown-wasm-bytes", async (request, reply) => {  
    return await tryForwardRemoteWasmBytes(reply, "https://cdn.glitch.global/299277f2-19a3-45d8-8a11-ccbaff9d6682/parsedown_bg.wasm?v=1713889531572");
  });
  
  // Route for our JS module that imports a wasm to parse markdown
  server.get("/parsedown-module.js", async (request, reply) => {  
    tryForwardScript(reply, "public/parsedown-module.js");  
  });

  // Route for the fenced frame created by script
  server.get('/parsedown-inner', async (request, reply) => {
    setFencedFrameHeaders(reply);
    setViewParams(request, 'parsedown');
    return await reply.view("/src/pages/parsedown-inner.hbs", viewParams);
  });
  
  // Route for our JS glue module
  server.get("/get-parsedown-js-string", async (request, reply) => {  
    tryForwardScriptAsTextResponse(reply, "public/parsedown.js");  
  });

  // Run the server and report out to the logs
  server.listen(
    { port: process.env.PORT, host: "0.0.0.0" },
    function (err, address) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`Your app is listening on ${address}`);
    }
  );
})();

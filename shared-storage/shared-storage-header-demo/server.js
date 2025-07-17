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
  
  function getDate() {
    const currentDate = new Date();
    const options = { dateStyle: 'long', timeStyle: 'long' };
    return currentDate.toLocaleString(undefined, options); 
  }
  
  function getRawBasicSharedStorageHeaderValue(method, key=undefined, value=undefined, customText=undefined) {
    switch(method) {
      // Basic methods
      case 'set':
        if (!key || !value) {
          return '';
        }
        return `set;key="${key}";value="${value}"`;
      case 'set-ignore-if-present':
        if (!key || !value) {
          return '';
        }
        return `set;key="${key}";value="${value}";ignore_if_present`;
      case 'append':
        if (!key || !value) {
          return '';
        }
        return `append;key="${key}";value="${value}"`;
      case 'delete':
        if (!key) {
          return '';
        }
        return `delete;key="${key}"`;
      case 'clear':
        return 'clear';
        
      // Preset combinations
      case 'set-append':
        return 'set;key="myKey";value="headValue",append;key="myKey";value="tailValue"'       
      case 'set-set-set':
        return 'set;key="key1";value="val1",set;key="key2";value="val2",set;key="key3";value="val3"'
      case 'clear-set':
        return 'clear,set;key="1";value=""';
      case 'delete-set-set-append':
        return 'delete;key="1",set;key="2";value="true",set;key="3";value="false",append;key="3";value="?"'
        
      // Custom user input
      case 'custom':
        if (!customText)
          return '';
        return customText;
        
      default:
        return '';
    }
  }
  
  function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  function getRandomItemFromArray(arr) {
    if (!arr || !arr.length) {
      return undefined;
    }
    return arr[getRandomIntInclusive(0, arr.length - 1)];
  }
  
  function getRandomMethod() {
    return getRandomItemFromArray(['set', 'set', 'set', 'set', 'append', 'append', 'append', 'delete', 'delete', 'clear']);
  }
  
  function getRandomLowercase() {
    return String.fromCharCode(getRandomIntInclusive(97, 103));
  }
  
  function getRandomBoolean() {
    return getRandomIntInclusive(0, 3) === 1;
  }
  
  let rawSharedStorageHeaderValue = '';
  const params = {
    theme: 'light',
    rawSharedStorageHeaderValue: rawSharedStorageHeaderValue,
    encodedSharedStorageHeaderValue: encodeURIComponent(rawSharedStorageHeaderValue),
    rawRandomSharedStorageHeaderValueExample: ''
  };
  
  function setRandomHeaderValue() {
    const numMethods = getRandomIntInclusive(2, 4);
    let headerValue = '';
    for (let i = 0; i < numMethods; ++i) {
      let method = getRandomMethod();
      if (i !== 0) {
        headerValue += ',';
        while (method === 'clear') {
          method = getRandomMethod();
        }
      }
      headerValue += method;
      switch (method) {
        case 'clear':
          break;
        case 'delete':
          headerValue += ';key="' + getRandomLowercase() + '"';
          break;
        case 'append':
          headerValue += ';key="' + getRandomLowercase() + '"';
          headerValue += ';value="' + getRandomLowercase() + '"';
          break;
        case 'set':
          headerValue += ';key="' + getRandomLowercase() + '"';
          headerValue += ';value="' + getRandomLowercase() + '"';
          if (getRandomBoolean) {
            headerValue += ';ignore_if_present';
          }
          break;
        default:
          break;
      }
    }
    params.rawRandomSharedStorageHeaderValueExample = headerValue;
  }
  
  setRandomHeaderValue();
  
  function setParams(request, key) {
    params.theme = request.query.theme || 'light';
    const method = request.query.method;
    const customText = request.query.custom || '';
    const value =  `${getDate()}`;
    params.rawSharedStorageHeaderValue = 
      (method === 'random') ? params.rawRandomSharedStorageHeaderValueExample 
      : getRawBasicSharedStorageHeaderValue(method, key, value, customText);
    params.encodedSharedStorageHeaderValue = encodeURIComponent(params.rawSharedStorageHeaderValue);
    console.log(params);
  }
  
  function setSharedStorageHeader(request, reply) {
    const writeHeader = request.query.write || '';
    
    // Header to write date to shared storage 
    reply.header('Shared-Storage-Write', writeHeader);
  }
  
  function setIframeHeaders(reply) {
    reply.header('Content-Type', 'text/html');

    // Headers to prevent caching
    reply.header('Cache-Control', 'no-cache, no-store, must-revalidate'); 
    reply.header('Pragma', 'no-cache'); 
    reply.header('Expires', '0'); 
  }
  
  function setImgHeaders(reply) {
    // Set image-specific headers
    reply.header('Content-Type', 'image/webp');

    // Headers to prevent caching
    reply.header('Cache-Control', 'no-cache, no-store, must-revalidate'); 
    reply.header('Pragma', 'no-cache'); 
    reply.header('Expires', '0'); 
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
  
  async function tryForwardScript(reply, scriptUrl) {
    try {
      const data = fs.readFileSync(scriptUrl, 'utf8');
      reply.header('Content-Type', 'text/javascript');
      reply.send(data);
    } catch (error) {
      console.error('Error reading file: ', error);
      return;
    }
  }
  
  // Our main GET home page route, pulls from src/pages/index.hbs
  server.get("/", async (request, reply) => {
    reply.header('Content-Type', 'text/html'); 
    return await reply.view("/src/pages/index.hbs", params);
  });
  
  // Route for our custom code-box tag definition script
  server.get("/code-box", async (request, reply) => {
    tryForwardScript(reply, "public/code-box.js");
  });
  
  // Route for our custom dark mode script
  server.get("/dark-mode", async (request, reply) => {
    tryForwardScript(reply, "public/dark-mode.js");
  });
  
  server.get('/get-new-random-header-value', (request, reply) => {
    setRandomHeaderValue();
    reply.send(params);
  });
  
  // Default document for the page's iframe
  server.get("/default-frame", async (request, reply) => {
    reply.header('Content-Type', 'text/html');
    setParams(request, '');
    return await reply.view("/src/pages/default-frame.hbs", params);
  });
  
  // Route for the intermediate iframe "iframe-tag.hbs"
  server.get("/iframe-tag-outer", async (request, reply) => {
    reply.header('Content-Type', 'text/html');
    setParams(request, 'iframe-tag-key');
    if (request.query.cross && request.query.cross === 'true') {
      return await reply.view("/src/pages/cross-origin-iframe-tag.hbs", params);
    }
    return await reply.view("/src/pages/iframe-tag.hbs", params);
  });
  
  // Route for the intermediate iframe "iframe-script.hbs"
  server.get("/iframe-script-outer", async (request, reply) => {
    reply.header('Content-Type', 'text/html'); 
    setParams(request, 'iframe-script-key');
    if (request.query.cross && request.query.cross === 'true') {
      return await reply.view("/src/pages/cross-origin-iframe-script.hbs", params);
    }
    return await reply.view("/src/pages/iframe-script.hbs", params);
  });
  
  // Route for the intermediate iframe "img-tag.hbs"
  server.get("/img-tag-outer", async (request, reply) => {
    reply.header('Content-Type', 'text/html'); 
    setParams(request, 'img-tag-key');
    if (request.query.cross && request.query.cross === 'true') {
      return await reply.view("/src/pages/cross-origin-img-tag.hbs", params);
    }
    return await reply.view("/src/pages/img-tag.hbs", params);
  });
  
  // Route for the intermediate iframe "img-script.hbs"
  server.get("/img-script-outer", async (request, reply) => {
    reply.header('Content-Type', 'text/html'); 
    setParams(request, 'img-script-key');
    if (request.query.cross && request.query.cross === 'true') {
      return await reply.view("/src/pages/cross-origin-img-script.hbs", params);
    }
    return await reply.view("/src/pages/img-script.hbs", params);
  });
  
  
  // Route for the intermediate iframe "img-fetch.hbs"
  server.get("/img-fetch-outer", async (request, reply) => {
    reply.header('Content-Type', 'text/html'); 
    setParams(request, 'img-fetch-key');
    if (request.query.cross && request.query.cross === 'true') {
      return await reply.view("/src/pages/cross-origin-img-fetch.hbs", params);
    }
    return await reply.view("/src/pages/img-fetch.hbs", params);
  });
  
  // Route for the iframe tag
  server.get('/iframetag', async (request, reply) => {
    setIframeHeaders(reply);
    setSharedStorageHeader(request, reply);
    setParams(request, '');
    return await reply.view("/src/pages/iframe-tag-frame.hbs", params);
  });
  
  // Route for the iframe created by script
  server.get('/iframescript', async (request, reply) => {
    setIframeHeaders(reply);
    setSharedStorageHeader(request, reply);
    setParams(request, '');
    return await reply.view("/src/pages/iframe-script-frame.hbs", params);
  });
  
  // Route for the image tag
  server.get('/imagetag', async (request, reply) => {
    setImgHeaders(reply);
    setSharedStorageHeader(request, reply);
    const imageUrl = 'https://cdn.glitch.global/3fefe35b-bbb3-4e52-b0f1-f94d09bc62e4/cat-side.webp?v=1709255861343';
    await tryForwardImage(reply, imageUrl);
  });
  
  // Route for the image created by script
  server.get('/imagescript', async (request, reply) => {
    setImgHeaders(reply);
    setSharedStorageHeader(request, reply);
    const imageUrl = 'https://cdn.glitch.global/3fefe35b-bbb3-4e52-b0f1-f94d09bc62e4/cat-coding.webp?v=1709744151344';
    await tryForwardImage(reply, imageUrl);
  });
  
  // Route for the image retrieved by `fetch()`
  server.get('/imagefetch', async (request, reply) => {
    setImgHeaders(reply);
    setSharedStorageHeader(request, reply);
    const imageUrl = 'https://cdn.glitch.global/3fefe35b-bbb3-4e52-b0f1-f94d09bc62e4/cat-mouse.webp?v=1709746463961';
    await tryForwardImage(reply, imageUrl);
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

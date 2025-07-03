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
  
  function setSharedStorageHeader(request, reply) {
    const writeHeader = request.query.write || '';
    
    // Header to write date to shared storage 
    reply.header('Shared-Storage-Write', writeHeader);
  }
  
  function allowCrossOriginLoading(reply) {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('X-Frame-Options', 'ALLOW-FROM https://shared-storage-header-demo.glitch.me https://glitch.com https://global-aluminum-water.glitch.me');
    reply.header('Content-Security-Policy', "frame-ancestors 'self' https://shared-storage-header-demo-alt-origin.glitch.me/ https://shared-storage-header-demo.glitch.me https://glitch.com https://global-aluminum-water.glitch.me;");
  }
  
  function preventCaching(reply) {
    reply.header('Cache-Control', 'no-cache, no-store, must-revalidate'); 
    reply.header('Pragma', 'no-cache'); 
    reply.header('Expires', '0'); 
  }
  
  function setIframeHeaders(reply) {
    reply.header('Content-Type', 'text/html');
    allowCrossOriginLoading(reply);
    preventCaching(reply);
  }
  
  function setImgHeaders(reply) {
    reply.header('Content-Type', 'image/webp');
    allowCrossOriginLoading(reply);
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
    return await reply.view("/src/pages/index.hbs", {});
  });
  
  // Route for our custom dark mode script
  server.get("/dark-mode", async (request, reply) => {
    tryForwardScript(reply, "public/dark-mode.js");
  });
  
  // Blank frame for the embedder to load as a way to ensure that DevTools shows this 
  // alternate origin even when a cross-origin request hasn't yet been made.
  server.get('/blank', async (request, reply) => {
    setIframeHeaders(reply);
    return await reply.view("/src/pages/blank.hbs", {});
  });
  
  // Route for the iframe tag
  server.get('/iframetag', async (request, reply) => {
    setIframeHeaders(reply);
    setSharedStorageHeader(request, reply);
    return await reply.view("/src/pages/iframe-tag-frame.hbs", {});
  });
  
  // Route for the iframe created by script
  server.get('/iframescript', async (request, reply) => {
    setIframeHeaders(reply);
    setSharedStorageHeader(request, reply);
    return await reply.view("/src/pages/iframe-script-frame.hbs", {});
  });
  
  // Route for the image tag
  server.get('/imagetag', async (request, reply) => {
    setImgHeaders(reply);
    setSharedStorageHeader(request, reply);
    const imageUrl = 'https://cdn.glitch.global/3fefe35b-bbb3-4e52-b0f1-f94d09bc62e4/cat-side.webp?v=1709255861343';
    await tryForwardImage(reply, imageUrl);
  });
  
  // Route for the sandbox iframe tag
  server.get('/sandbox-iframetag', async (request, reply) => {
    setIframeHeaders(reply);
    setSharedStorageHeader(request, reply);
    return await reply.view("/src/pages/sandbox-iframe-tag-frame.hbs", {});
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

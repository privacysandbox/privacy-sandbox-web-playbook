async function fetchWasmBytes(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Error fetching WASM bytes");
  }
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

async function fetchJsString(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Error fetching JS string");
  }
  const buffer = await response.text();
  return buffer;
}

function generateURLs(url, numURLs) {
  const urls = [];
  for (let i = 0; i < numURLs; i++) {
    urls.push({ url: `${url}?index=${i}&theme={{theme}}` });
  }
  return urls;
}

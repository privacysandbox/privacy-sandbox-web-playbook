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

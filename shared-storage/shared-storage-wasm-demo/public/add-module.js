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
class Add {
  async run(urls, data) {
    if (!data.hasOwnProperty('x') || !data.hasOwnProperty('y')) {
      console.error('missing data input for x and/or y');
      return -1;
    }
    if (!data.hasOwnProperty('wasmBytes')) {
      console.error('missing data input for wasmBytes');
      return -1;
    }
    const wasmBytes = data['wasmBytes'];
    const buffer = wasmBytes.buffer;
    let index = -1;
    let instance = null;
    const importObject = {
      imports: {
        imported_func: arg => {
          console.log(arg);
        }
      }
    };
    try {
      const isValid = WebAssembly.validate(buffer);
      console.log(`The given bytes ${isValid ? "are" : "are not"} a valid wasm module`);
      const result = await WebAssembly.instantiate(buffer, importObject);
      instance = result.instance;
      console.log("instantiated wasm for add; ", instance.exports.add(5, 3)); 
      index = instance.exports.add(parseInt(data['x']), parseInt(data['y'])) % urls.length;
    } catch (error) {
      console.error("Error loading Wasm for add:", error); 
    }
    console.log('instance:', Boolean(instance));
    console.log('index:', index);
    return index;
  }
}

register('add', Add);
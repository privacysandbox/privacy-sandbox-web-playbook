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
class Parsedown {
  async run(urls, data) {
    if (!data.hasOwnProperty('markdown')) {
      console.error('missing data input for markdown');
      return -1;
    }
    if (!data.hasOwnProperty('jsString')) {
      console.error('missing data input for jsString');
      return -1;
    }
    if (!data.hasOwnProperty('wasmBytes')) {
      console.error('missing data input for wasmBytes');
      return -1;
    }
    const markdown = data['markdown'];
    const jsString = data['jsString'];
    const wasmBytes = data['wasmBytes'];
    const context = eval?.(jsString);
    
    await instantiate(wasmBytes);
    const textResult = markdown_to_plaintext(markdown, {});
    await sharedStorage.set('parsed markdown', textResult);
    console.log(textResult);
    console.log(textResult.length);
    console.log(textResult.length % urls.length)
    return textResult.length % urls.length;
  }
}

register('parsedown', Parsedown);
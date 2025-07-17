#!/usr/bin/env node

//Copyright 2025 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// **This is not an officially supported Google product**

const fs = require('fs');
const path = require('path');

// --- Configuration ---
const APACHE_LICENSE_REGEX = /Copyright \d{4} Google (Inc|LLC)[\s\S]*Licensed under the Apache License, Version 2\.0/;

const DISCLAIMER = 'This is not an officially supported Google product';

const IGNORE_CONFIG = {
  directories: ['node_modules', '.git', '.github', 'dist', 'build'],
  extensions: [
    '.json', '.lock',
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
    '.wasm', '.bin', '.exe', '.dll', '.so',
    '.zip', '.tar', '.gz', '.pdf', '.doc'
  ],
   filenames: [
      'LICENSE',
      '.gitignore',
      '.npmrc',
      '.pre-commit-config.yaml',
      'requirements.txt',
      'shared-storage/shared-storage-wasm-demo/public/parsedown.js'
    ],
   fullPaths: [
    'shared-storage/shared-storage-wasm-demo/public/parsedown.js'
  ]
};
// --- End Configuration ---

function isIgnored(filePath) {
  const extension = path.extname(filePath);
  const filename = path.basename(filePath);
  if (IGNORE_CONFIG.filenames.includes(filename)) return true;
  if (IGNORE_CONFIG.extensions.includes(extension)) return true;
  const directoryParts = filePath.split(path.sep);
  return directoryParts.some(part => IGNORE_CONFIG.directories.includes(part));
}

let hasFailed = false;
const files = process.argv.slice(2);

files.forEach(file => {
  if (isIgnored(file)) {
    return;
  }

  try {
    const buffer = fs.readFileSync(file);
    if (buffer.includes(0)) return; // Skip binary files

    const content = buffer.toString('utf8');
    const missingHeaders = [];

    // --- Conditional Check Logic ---
    const isReadme = path.basename(file).toLowerCase() === 'readme.md';
    const isContributing = path.basename(file).toLowerCase() === 'contributing.md';


    if (isReadme || isContributing) {
      // Rule for README.md files: ONLY check for the disclaimer.
      if (!content.includes(DISCLAIMER)) {
        missingHeaders.push(`  - The disclaimer: "${DISCLAIMER}"`);
      }
    } else {
      // Rule for all other files: check for BOTH license and disclaimer.
      if (!APACHE_LICENSE_REGEX.test(content)) {
        missingHeaders.push('  - A valid Apache License header.');
      }
      if (!content.includes(DISCLAIMER)) {
        missingHeaders.push(`  - The disclaimer: "${DISCLAIMER}"`);
      }
    }
    // --- End Conditional Logic ---


    if (missingHeaders.length > 0) {
      console.error(`
-----------------------------------------------------------------------
❌ Header Check Failed
File:    ${file}
Problem: The following required headers were missing or incorrect:
${missingHeaders.join('\n')}

Action:  Please add the required content to the file.
-----------------------------------------------------------------------`);
      hasFailed = true;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`\n❌ ERROR: Could not read file ${file}:`, error);
      hasFailed = true;
    }
  }
});

if (hasFailed) {
  process.exit(1);
}

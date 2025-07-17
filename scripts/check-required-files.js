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
const DEMO_IDENTIFIER_FILES = [
  'package.json', 'Dockerfile', 'requirements.txt',
  'pyproject.toml', 'go.mod', 'Cargo.toml'
];
const IGNORE_DIRS = new Set(['node_modules', '.git', '.github', 'dist', 'build', '.vscode', 'scripts']);

// --- End Configuration ---

/**
 * Recursively scans for directories that contain demo identifier files.
 * @param {string} currentPath The directory to start scanning from.
 * @returns {string[]} An array of paths to the identified demo directories.
 */
function findDemoDirs(currentPath) {
  const discoveredDemos = [];
  const items = fs.readdirSync(currentPath, { withFileTypes: true });
  const isDemo = items.some(item => DEMO_IDENTIFIER_FILES.includes(item.name));

  if (isDemo) {
    return [currentPath];
  }

  for (const item of items) {
    if (item.isDirectory() && !IGNORE_DIRS.has(item.name)) {
      const nestedDemos = findDemoDirs(path.join(currentPath, item.name));
      discoveredDemos.push(...nestedDemos);
    }
  }
  return discoveredDemos;
}

let hasFailed = false;

console.log("ℹ️  Scanning for demo directories...");
const demoDirs = findDemoDirs('.');

if (demoDirs.length === 0) {
  console.log("✅ No demo directories found to check. Skipping.");
} else {
  console.log(`✅ Found ${demoDirs.length} demo(s). Checking for required files in:`);
  demoDirs.forEach(dir => console.log(`   - ${dir}`));

  demoDirs.forEach(dir => {
    const missingFiles = [];
    const readmePath = path.join(dir, 'README.md');
    const contributingPath = path.join(dir, 'CONTRIBUTING.md');
    const licensePath = path.join(dir, 'LICENSE');

    if (!fs.existsSync(readmePath)) {
      missingFiles.push(`  - Expected file at: ${readmePath}`);
    }
    if (!fs.existsSync(contributingPath)) {
      missingFiles.push(`  - Expected file at: ${contributingPath}`);
    }
    if (!fs.existsSync(licensePath)) {
      missingFiles.push(`  - Expected file at: ${licensePath}`);
    }

    if (missingFiles.length > 0) {
      console.error(`
-----------------------------------------------------------------------
❌ Missing Required Files
Demo Root: '${dir}'
Problem:   This demo directory is missing required documentation files.
${missingFiles.join('\n')}

Action:    Please create these files within the '${dir}' directory.
-----------------------------------------------------------------------`);
      hasFailed = true;
    }
  });
}

if (hasFailed) {
  process.exit(1);
}
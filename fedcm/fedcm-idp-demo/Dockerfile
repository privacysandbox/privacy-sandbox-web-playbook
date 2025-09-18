#  Copyright 2025 Google Inc.
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
#
#  NOTE: This is not an officially supported Google product

# ---- Stage 1: The Builder ----
# This stage installs all dependencies (including devDependencies)
# and runs the webpack build to create the /dist folder.
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

ENV HOST=0.0.0.0 

# Copy package definition files
COPY package*.json ./
COPY shrinkwrap.yaml ./

# Install all dependencies needed for the build
RUN npm install

# Copy the rest of the application source code
# The .dockerignore file will prevent .env and node_modules from being copied
COPY . .

# Run the build script defined in package.json to create the /dist directory
RUN npm run build


# ---- Stage 2: The Runner ----
# This is the final, lean production image that will be deployed.
# It starts fresh and only copies the necessary files.
FROM node:20-alpine

WORKDIR /app

# Copy package definition files again
COPY package*.json ./
COPY shrinkwrap.yaml ./

# Install ONLY the production dependencies, skipping devDependencies
RUN npm install --omit=dev

# --- Copy Artifacts from the Builder Stage ---

# Copy the built frontend assets from the 'builder' stage
COPY --from=builder /app/dist ./dist

# --- Copy Necessary Server Files ---

# Copy the main server file
COPY server.js .

# Copy the server-side view templates
COPY views ./views

# Copy the public assets folder
COPY public ./public

# Copy the server-side libraries
COPY libs ./libs

COPY .data ./.data

# --- Final Configuration ---

# Expose the port the server runs on
EXPOSE 8080

# The command to start the production server (executes 'npm start')
CMD [ "npm", "start" ]
*This is not an officially supported Google product*

# FedCM Relying Party (RP) Demo

This project is a demonstration of a **Relying Party (RP)** implementing the [Federated Credential Management (FedCM) API](https://developer.chrome.com/docs/privacy-sandbox/fedcm/).

It is designed to work alongside a FedCM-compatible [Identity Provider (IdP)](https://github.com/privacysandbox/privacy-sandbox-web-playbook/tree/main/fedcm/fedcm-idp-demo) to showcase how a user can sign in to a website (the RP) using their existing account from another service (the IdP). This process happens through a browser-mediated flow with the FedCM API.

For a complete overview of the FedCM API and its goals, please refer to the [Official FedCM Documentation](https://privacysandbox.google.com/cookies/fedcm).

This demo is part of a pair. You will also need to run the corresponding **[IdP Demo](../fedcm-idp-demo)** for the full sign-in flow to work.

## Setting up a mock cross-site environment 

For the FedCM flow to work correctly and to accurately simulate a real-world scenario, your browser needs to perceive the Identity Provider (IdP) and Relying Party (RP) as **separate, secure domains**. 

This section explains how to use **Caddy** to set up a local reverse proxy that serves your demos on mock domains with HTTPS. This ensures your browser treats them as cross-site, allowing you to test FedCM in an appropriate context.

### 1. Update Your Hosts File

This step requires **administrator/root privileges**.

Add the following entries to your system's hosts file. This maps the mock domains to your local machine (`127.0.0.1`), allowing your browser to find them.

* **Windows:** `C:\Windows\System32\drivers\etc\hosts`
* **macOS/Linux:** `/etc/hosts`

```
127.0.0.1       fedcm-idp-demo.local
127.0.0.1       fedcm-rp-demo.local
```

### 2. Start the Caddy Proxy

A Caddy configuration file (`caddy/Caddyfile`) and a startup script (`mock-cross-site-env.sh` or `.bat`) are provided in the `fedcm/` directory of this monorepo.

This script will start Caddy, which automatically handles HTTPS certificate generation and trust for `fedcm-idp-demo.local` and `fedcm-rp-demo.local`. The first time you run it, Caddy will ask for your system password to install a local certificate authority (CA) into your browser's trust store.

Navigate to the `fedcm` directory and run the script:

```bash
cd fedcm
chmod +x mock-cross-site-env.sh # Only needed once
./mock-cross-site-env.sh
```

Keep the terminal window where Caddy is running open.

### 3. Configure environment variables

You need to specify the URLs of both the Identity Provider (IdP) and itself (the Relying Party).

Create a new file in the current fedcm/fedcm-rp-demo file named .env.
Add the following variables to the .env file, replacing the example URLs with your actual IdP and RP URLs with the mock domains you just set up:

```
PROVIDER_URLS=["https://fedcm-idp-demo.local"]
RP_URL=https://fedcm-rp-demo.local
IDP_URL=https://fedcm-idp-demo.local
```

### 4. Run the demos
Now make sure that the demos run on the right ports specified in the `/privacy-sandbox-web-playbook/fedcm/caddy/Caddyfile`. You can also modify thoe as needed, but the default is:
* RP: 8080
* IdP: 8081

## Hosted instance

We are transitioning to a new hosting solution for our live demo. Currently, you can check out the following URLs (but note that uptime for the current demo is not guaranteed):
* [RP](https://csy9zq-8080.csb.app/)
* [IdP](https://d2crcr-8080.csb.app/)

## Prerequisites

Before you begin, ensure you have the following:

1.  **Node.js and npm:** [Node.js](https://nodejs.org/) (v20+ recommended) installed on your system.
2.  **A Compatible Browser:** A browser that [supports](https://developer.mozilla.org/en-US/docs/Web/API/FederatedCredential#browser_compatibility) the FedCM API.

## Getting Started

Follow these steps to set up and run the Relying Party demo server.

### 1. Clone the Repository

This project is part of a larger monorepo. To save time and space, we recommend using Git's sparse-checkout feature to download only the files needed for this specific demo.

```bash
# Create a new directory for the project and navigate into it
git init fedcm-rp-demo-project
cd fedcm-rp-demo-project

# Add the remote repository
git remote add origin https://github.com/privacysandbox/privacy-sandbox-web-playbook.git

# Configure sparse checkout to only pull the RP demo directory
git sparse-checkout set fedcm/fedcm-rp-demo

# Pull the files from the main branch
git pull origin main

# Navigate into the demo directory to run commands
cd fedcm/fedcm-rp-demo
```

### 2. Install Dependencies

Install the required Node.js packages using npm:

```bash
npm install
```

### 3. Configure environment variables

This demo needs to know the URLs of both the Identity Provider (IdP) and itself (the Relying Party).

Create a new file in the current `fedcm/fedcm-rp-demo` file named `.env`.
Add the following variables to the `.env` file, replacing the example URLs with your actual IdP and RP URLs:

```bash
# The full URL of your running Identity Provider (IdP) demo
IDP1_URL=https:/idp.example

# The full URL of this Relying Party (RP) demo
RP_URL=https://rp.exampke
```
### 4. Build

```bash
npm run build
```

### 5. Runs
Start the RP server:

```bash
npm run start
```
The server will be running and listening on http://localhost:8081. You will see a confirmation message in your terminal.

## How to Use the Demo

To experience the FedCM flow, you must have both the IdP server and this RP server running simultaneously.

1. Start both servers: Ensure you have started the server for the RP demo (typically on port 8080) and this IdP demo (on port 8081).
1. Navigate to the RP Website: Open your browser and go to http://localhost:8081.
1. Initiate Sign-In: Click the button that says "Sign in with a Demo IdP".
1. Browser UI Prompt: This action triggers the FedCM API. You should see the browser's native UI appear, asking for your consent to sign in to the "RP Demo" using your account from the "IdP Demo".
1. Complete Sign-In: Click "Continue". The browser will securely mediate the token exchange between the IdP and the RP.
1. Logged-In State: The RP page will update to show that you are logged in, displaying the user information it received from the IdP.
## License

```
Copyright 2025 Google, Inc.

Licensed to the Apache Software Foundation (ASF) under one or more contributor
license agreements. See the NOTICE file distributed with this work for
additional information regarding copyright ownership. The ASF licenses this
file to you under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
```

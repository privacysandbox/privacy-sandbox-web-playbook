*This is not an officially supported Google product*

# FedCM Identity Provider (IdP) Demo

This project is a demonstration of an **Identity Provider (IdP)** that serves authentication requests for the [Federated Credential Management (FedCM) API](https://developer.chrome.com/docs/privacy-sandbox/fedcm/).

It is designed to work alongside a FedCM-compatible [Relying Party (RP)](https://github.com/privacysandbox/privacy-sandbox-web-playbook/tree/main/fedcm/fedcm-rp-demo) to showcase how a user can sign in to a website (the RP) using an account from this service (the IdP). This process happens through a browser-mediated flow.

For a complete overview of the FedCM API and its goals, please refer to the [Official FedCM Documentation](https://privacysandbox.google.com/cookies/fedcm).

This demo is part of a pair. You will also need to run the corresponding **[RP Demo](../fedcm-rp-demo)** for the full sign-in flow to work.

## Setting up a mock cross-site environment 

For the FedCM flow to work correctly and to accurately simulate a real-world scenario, your browser needs to perceive the Identity Provider (IdP) and Relying Party (RP) as **separate, secure domains**. 

This section explains how to use **Caddy** to set up a local reverse proxy that serves your demos on mock domains with HTTPS. This ensures your browser treats them as cross-site, allowing you to test FedCM in an appropriate context.

### 1. Update Your Hosts File

This step requires **administrator/root privileges**.

Add the following entries to your system's hosts file. This maps the mock domains to your local machine (`127.0.0.1`), allowing your browser to find them.

* **Windows:** `C:\Windows\System32\drivers\etc\hosts`
* **macOS/Linux:** `/etc/hosts`

```
127.0.0.1       fedcm-idp-demo.localhost
127.0.0.1       fedcm-rp-demo.localhost
```

### 2. Start the Caddy Proxy

A Caddy configuration file (`caddy/Caddyfile`) and a startup script (`mock-cross-site-env.sh` or `.bat`) are provided in the `fedcm/` directory of this monorepo.

This script will start Caddy, which automatically handles HTTPS certificate generation and trust for `fedcm-idp-demo.localhost` and `fedcm-rp-demo.localhost`. The first time you run it, Caddy will ask for your system password to install a local certificate authority (CA) into your browser's trust store.

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
IDP1_URL=https://fedcm-idp-demo.localhost
RP_URL=https://fedcm-rp-demo.localhost
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

Follow these steps to set up and run the Identity Provider demo server.

### 1. Clone the Repository

This project is part of a larger monorepo. To save time and space, we recommend using Git's `sparse-checkout` feature to download only the files needed for this specific demo.

```bash
# Create a new directory for the project and navigate into it
git init fedcm-idp-demo-project
cd fedcm-idp-demo-project

# Add the remote repository
git remote add origin https://github.com/privacysandbox/privacy-sandbox-web-playbook.git

# Configure sparse checkout to only pull the IdP demo directory
git sparse-checkout set fedcm/fedcm-idp-demo

# Pull the files from the main branch
git pull origin main

# Navigate into the demo directory to run commands
cd fedcm/fedcm-idp-demo
```

### 2. Install Dependencies

Install the required Node.js packages using npm:

```bash
npm install
```
### 3. Configure Environment Variables

This demo requires several environment variables to function correctly, especially for local development.

1.  Create a new file in the current `fedcm/fedcm-idp-demo` file named `.env`.
2.  Add the following variables to the `.env` file.

    ```env
    # A list of trusted IdP URLs.
    PROVIDER_URLS=["https://idp.example"]

    # The full URL of the Relying Party (RP) demo you will be testing against.
    RP_URL=https://rp.example

    # The full URL of this Identity Provider (IdP) demo.
    IDP1_URL=https://idp.example

    # IMPORTANT: Set this to true for local development.
    # This ensures the session cookie is configured with `secure: false`,
    # allowing it to work over insecure http://localhost.
    DEV_ENV=true
    ```

### 4. Build

Build the project assets:
```bash
npm run build
```

### 5. Run

Start the IdP server:
```bash
npm run start
```

## How to Use the Demo

To experience the FedCM flow, you must have both this **IdP server** and the **RP server** running simultaneously.

1.  **Start Both Servers:** Ensure you have started the server for this RP demo (on port `8080`) and the IdP demo (on port `8081`).
2.  **Create an Account on the IdP:** Open your browser and navigate to the IdP website at `http://localhost:8081`. Create a demo account (e.g., `demo@example.com`).
3.  **Navigate to the RP Website:** In a new tab, go to the RP's website at `http://localhost:8080`.
4.  **Initiate Sign-In:** On the RP page, click the button that says **"Sign in with a Demo IdP"**.
5.  **Browser UI Prompt:** This action triggers the FedCM API. Because you have an active session with the IdP, the browser will display its native UI, asking for your consent to sign in to the "RP Demo" using your IdP account.
6.  **Complete Sign-In:** Click "Continue". The browser securely mediates the token exchange between this IdP and the RP. The RP page will update to show you are logged in.

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
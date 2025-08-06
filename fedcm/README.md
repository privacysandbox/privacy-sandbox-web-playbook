*This is not an officially supported Google product*

# Federated Credential Management (FedCM) Demos

This directory contains a collection of demos for the [Federated Credential Management (FedCM) API](https://developer.chrome.com/docs/privacy-sandbox/fedcm/). These demos illustrate how a browser can mediate identity federation between a website (Relying Party) and an identity provider.

The typical flow involves two main parties: a Relying Party (RP) and an Identity Provider (IdP).

## Projects

This directory contains the following demo projects:

*   **`fedcm-rp-demo/`**: A demo **Relying Party (RP)**. An RP is a website that a user wants to sign in to. Instead of managing its own user accounts and passwords, it relies on a trusted third party (an Identity Provider) to handle user authentication. This demo shows how an RP integrates with the FedCM API to request user credentials.

*   **`fedcm-idp-demo/`**: A demo **Identity Provider (IdP)**. An IdP is a service that manages user identities and provides authentication. When an RP requests to sign in a user, the IdP is responsible for authenticating the user (e.g., via username/password) and issuing an identity token back to the RP, via the browser's FedCM API.

*   **`fedcm-another-idp-demo/`**: A second demo **Identity Provider (IdP)**. This IdP is functionally similar to `fedcm-idp-demo`. Its primary purpose is to be run alongside the first IdP to demonstrate how FedCM supports a multi-IdP account chooser, allowing users to select from different identity providers within a single sign-in flow.

*   **`fedcm-multi-idp-rp/`**: A demo **Relying Party (RP)** specifically configured to work with multiple IdPs (`fedcm-idp-demo` and `fedcm-another-idp-demo`). It demonstrates how an RP can present the user with a choice of identity providers.

## Setting up a mock cross-site environment

For the FedCM flow to work correctly and to accurately simulate a real-world scenario, your browser needs to perceive the Identity Provider (IdP) and Relying Party (RP) as **separate, secure domains**.

This section explains how to use **Caddy** to set up a local reverse proxy that serves your demos on mock domains with HTTPS. This ensures your browser treats them as cross-site, allowing you to test FedCM in an appropriate context.

### 1. Update Your Hosts File

This step requires **administrator/root privileges**.

Add the following entries to your system's hosts file. This maps the mock domains to your local machine (`127.0.0.1`), allowing your browser to find them.

*   **Windows:** `C:\Windows\System32\drivers\etc\hosts`
*   **macOS/Linux:** `/etc/hosts`

```
127.0.0.1       fedcm-idp-demo.local
127.0.0.1       fedcm-rp-demo.local
```

### 2. Start the Caddy Proxy

A Caddy configuration file (`caddy/Caddyfile`) and a startup script (`mock-cross-site-env.sh` or `.bat`) are provided in the `fedcm/` directory of this monorepo.

The `Caddyfile` is configured to proxy requests to the correct local ports:
*   `https://fedcm-idp-demo.local` -> `localhost:8080` (for `fedcm-idp-demo`)
*   `https://fedcm-rp-demo.local` -> `localhost:8081` (for `fedcm-rp-demo`)

This script will start Caddy, which automatically handles HTTPS certificate generation and trust for the mock domains. The first time you run it, Caddy will ask for your system password to install a local certificate authority.

From this `fedcm` directory, run the script:

```bash
chmod +x mock-cross-site-env.sh # Only needed once
./mock-cross-site-env.sh
```

Keep the terminal window where Caddy is running open.

### 3. Run the Demos

With Caddy running, you can now start the individual demo servers. Each demo directory (e.g., `fedcm-rp-demo`, `fedcm-idp-demo`) contains its own `README.md` with specific instructions for installing dependencies, configuring environment variables, and running the server.

Make sure the demos run on the correct ports as specified in the `caddy/Caddyfile`:
*   **IdP Demo (`fedcm-idp-demo`)**: Port `8080`
*   **RP Demo (`fedcm-rp-demo`)**: Port `8081`

Follow the instructions in each project's `README.md` to get started.

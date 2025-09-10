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

## Running the Demos

This project is configured to run the three main demos (`fedcm-rp-demo`, `fedcm-idp-demo`, and `fedcm-another-idp-demo`) concurrently with a single command. This setup uses **Caddy** as a reverse proxy to accurately simulate a real-world, cross-site environment with HTTPS.

### Prerequisites

1.  **Node.js and npm**: Ensure you have Node.js (v18+) and npm installed.
2.  **Available Ports**: The demo servers require ports `8080`, `8081`, and `8082` to be free. You can check for running processes on these ports with the following commands:
       
        lsof -i :8080 -i :8081 -i :8082

    If any of these commands show output, you will need to stop the process using that port before proceeding.


### 1. Configure Environment Variables

Each demo project needs to know the URLs of the other projects. You must create a `.env` file in each of the three demo directories with the content specified below.

#### In **`fedcm/`**, create a `.env` file:

```
    IDP1_URL=https://fedcm-idp-demo.localhost
    IDP2_URL=https://fedcm-another-idp-demo.localhost
    RP_URL=https://fedcm-rp-demo.localhost
    PROVIDER_URLS=["https://fedcm-idp-demo.localhost", "https://fedcm-another-idp-demo.localhost"]
```

### 2. Install and Run the Environment

Navigate to this `fedcm/` directory and run the following commands:

```bash
# Install root dependencies and dependencies for all sub-projects
npm install
```

```bash
# Start all demo projects and the Caddy proxy
npm start
```

#### What `npm start` Does

The `npm start` command triggers the entire environment setup:

1.  **Starts Demo Servers**: It starts the servers for the three core projects:
    *   `fedcm-rp-demo` on port `8080`
    *   `fedcm-idp-demo` on port `8081`
    *   `fedcm-another-idp-demo` on port `8082`

    Their logs will appear in your terminal with color-coded prefixes like `[RP]`, `[IDP]`, and `[IDP-2]`.

2.  **Waits for Servers**: It waits until all three demo servers are up and running before proceeding.

3.  **Starts Caddy Proxy**: Once the servers are ready, it launches the Caddy reverse proxy. The proxy provides the secure HTTPS layer and maps the running demo servers to the `.local` domains you configured in your hosts file:
    *   `https://fedcm-rp-demo.localhost` → `localhost:8080`
    *   `https://fedcm-idp-demo.localhost` → `localhost:8081`
    *   `https://fedcm-another-idp-demo.localhost` → `localhost:8082`

    The first time it runs, it may ask for your system password to install the certificates. Caddy's logs are saved to a `caddy.log` file in this directory.

### Access the Demos in Your Browser

With the environment running, you can now test the FedCM flow:
   *   [https://fedcm-rp-demo.localhost](https://fedcm-rp-demo.localhost) - Relying Party (RP)
   *   [https://fedcm-idp-demo.localhost](https://fedcm-idp-demo.localhost) - Identity Provider (IdP)
   *   [https://fedcm-another-idp-demo.localhost](https://fedcm-another-idp-demo.localhost) - Another Identity Provider (IdP)


## FedCM Feature Demos

This project demonstrates various features of the **Federated Credential Management (FedCM) API**. 

| Feature | Demo Page | Documentation |
| :--- | :--- | :--- |
| **Passive Mode**  | [`https://fedcm-rp-demo.localhost/`](https://fedcm-rp-demo.localhost/) | [FedCM Auto-reauthentication](https://privacysandbox.google.com/cookies/fedcm/why#fedcm_ui_modes) |
| **Active Mode** | [`https://fedcm-rp-demo.localhost/active-mode`](https://fedcm-rp-demo.localhost/active-mode) | [FedCM Sign-in Flow](https://privacysandbox.google.com/cookies/fedcm/why#fedcm_ui_modes) |
| **Multiple IdPs** | [`https://fedcm-rp-demo.localhost/multi-idp`](https://fedcm-rp-demo.localhost/multi-idp) | [FedCM Developer Guide](https://privacysandbox.google.com/cookies/fedcm/implement/identity-provider) |
| **Domain Hint**  | [`https://fedcm-rp-demo.localhost/domain-hint`](https://fedcm-rp-demo.localhost/domain-hint) | [Using `domain_hint`](https://privacysandbox.google.com/cookies/fedcm/implement/relying-party#domain-hint) |
| **Domain Hint in Passive Mode** | [`https://fedcm-rp-demo.localhost/domain-hint-passive`](https://fedcm-rp-demo.localhost/domain-hint-passive) | [Using `domain_hint`](https://privacysandbox.google.com/cookies/fedcm/implement/relying-party#domain-hint) |
| **Custom Fields**  | [`https://fedcm-rp-demo.localhost/alternative-fields`](https://fedcm-rp-demo.localhost/alternative-fields) | [IdP Sign-in Endpoint](https://privacysandbox.google.com/cookies/fedcm/implement/relying-party#fields) |


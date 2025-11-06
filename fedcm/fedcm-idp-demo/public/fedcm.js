/*
 * @license
 * Copyright 2019 Google Inc. All rights reserved.
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
const IDP_CONFIG = "{{idp_origin}}/fedcm.json";

const $ = document.querySelector.bind(document);

const _fetch = async (path, payload = "") => {
  const headers = {
    "X-Requested-With": "XMLHttpRequest",
  };
  if (payload && !(payload instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(payload);
  }
  const res = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: headers,
    body: payload,
  });
  if (res.status === 200) {
    // Server authentication succeeded
    return res.json();
  } else {
    // Server authentication failed
    const result = await res.json();
    throw new Error(result.error);
  }
};

export class IdentityProvider {
  constructor(options) {
    const { configURL, clientId = "" } = options;
    if (clientId === "") {
      clientId = document.querySelector(
        'meta[name="fedcm_demo_client_id"]'
      )?.content;
    }
    if (clientId === "") {
      throw new Error("client ID is not declared.");
    }
    const url = new URL(configURL);
    this.origin = url.origin;
    this.configURL = configURL;
    this.clientId = clientId;
  }

  async signIn(options = {}) {
    let {
      mode = "passive",
      loginHint,
      domainHint,
      context,
      fields,
      mediation,
      params = {},
    } = options;

    let nonce = params?.nonce || document.querySelector('meta[name="nonce"]')?.content;
    if (!nonce || !this.clientId) {
      throw new Error("nonce or client_id is not declared.");
    }

    const providersArray =  [
            {
              configURL: this.configURL,
              clientId: this.clientId,
              loginHint,
              domainHint,
              fields,
              params: { ...params, nonce },
            },
          ];

    const credential = await navigator.credentials
      .get({
        identity: {
          providers: [
            {
              configURL: this.configURL,
              clientId: this.clientId,
              loginHint,
              domainHint,
              fields,
              params: { ...params, nonce },
            },
          ],
          mode,
          context,
        },
        mediation,
      })
      .catch((e) => {
        console.log(e);
        throw e;
      });
    const token = credential.token;
    return token;
  }

  redirect() {
    location.href = this.origin;
  }

  setIframe(domId, callback) {
    const dom = document.querySelector(`#${domId}`);
    if (!dom) throw new Error("Specified DOM ID doesn't exit");

    const iframe = document.createElement("iframe");
    iframe.setAttribute("allow", "identity-credentials-get");
    iframe.src = `${this.origin}/iframe`;
    dom.appendChild(iframe);

    window.addEventListener("message", async (e) => {
      if (e.origin === this.origin && e.data === "sign-in") {
        await callback();
      }
    });
  }

  async signOut() {
    try {
      if (navigator.credentials && navigator.credentials.preventSilentAccess) {
        await navigator.credentials.preventSilentAccess();
      }
    } catch (e) {
      throw new Error(e.message);
    }
  }

  async disconnect(accountId) {
    try {
      return await IdentityCredential.disconnect({
        configURL: this.configURL,
        clientId: this.clientId,
        accountHint: accountId,
      });
    } catch (e) {
      throw new Error("Failed disconnecting with the error: ", e.message);
    }
  }
}

const tokenElement = document.createElement("meta");
tokenElement.httpEquiv = "origin-trial";
tokenElement.content =
  "A5tatBEy10rzsrEIWXtOBhIjSv8kJk827zp9/UU0wB9a70PpIH2WDUvDtDcdir3PVnVEwsRQtc/zFYYmuqYn2wQAAAB1eyJvcmlnaW4iOiJodHRwczovL2ZlZGNtLWlkcC1kZW1vLmdsaXRjaC5tZTo0NDMiLCJmZWF0dXJlIjoiRmVkQ21CdXR0b25Nb2RlIiwiZXhwaXJ5IjoxNzI3ODI3MTk5LCJpc1RoaXJkUGFydHkiOnRydWV9";
document.head.appendChild(tokenElement);

const tokenElement2 = document.createElement("meta");
tokenElement2.httpEquiv = "origin-trial";
tokenElement2.content =
  "A6pTt1tzQq9g5FYMWlaXJphgJ2UN8nbLX10mJZg41c7nwvAVs8s7eLjxnkbbsyrdkA07pE1iJt8tdNyq2uXJCQEAAAB7eyJvcmlnaW4iOiJodHRwczovL2ZlZGNtLWlkcC1kZW1vLmdsaXRjaC5tZTo0NDMiLCJmZWF0dXJlIjoiRmVkQ21Db250aW51ZU9uQnVuZGxlIiwiZXhwaXJ5IjoxNzMzMjcwMzk5LCJpc1RoaXJkUGFydHkiOnRydWV9";
document.head.appendChild(tokenElement2);

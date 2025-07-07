import { html, render } from 'https://unpkg.com/lit-html@2.2.0/lit-html.js?module';

export const $ = document.querySelector.bind(document);

export const toast = (text) => {
  $('#snackbar').labelText = text;
  $('#snackbar').show();
}

export const displayProfile = (profile) => {
  render(html`<div>
  </div>`, $('#profile'));
}

export const _fetch = async (path, payload = '') => {
  const headers = {
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (payload && !(payload instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(payload);
  }
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: headers,
    body: payload,
  });
  if (res.status === 200) {
    // Server authentication succeeded
    return res.json();
  } else {
    // Server authentication failed
    console.log()
    const result = await res.json();
    throw result.error;
  }
};

class Loading {
  constructor() {
    this.progress = $('#progress');
  }
  start() {
    this.progress.indeterminate = true;    
  }
  stop() {
    this.progress.indeterminate = false;    
  }
}

export const loading = new Loading();


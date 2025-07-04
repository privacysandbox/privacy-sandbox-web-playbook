const CODE_BOX_STYLE = `
/* Theme-Agnostic Styles */
.code-text-box img {
  height: auto;
  max-width: 20px;
  margin-left: 0;
  margin-right: 0;
}
.code-text-box .copy-icon {
  position: absolute;
  width: 20%;
  bottom: 5px;
  right: 0px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
}
/* Default Light Theme Styles */
.code-text-box {
  border: 1px solid #cccccc;
  background-color: #f0f0f0;  /* Light gray background */
  padding: 25px;
  margin-left: 5px;
  margin-right: 5px;
  margin-top: 10px;
  margin-bottom: 10px;  /* Add spacing between boxes */
  border-radius: 3px;  /* Slightly rounded corners */
  border-color: #f0f0ff;
  position: relative;
  display: inline-block;
  white-space: nowrap;  /* Prevent automatic line breaks */
  align-items: center;  * for vertical centering */
}
.code-text-box code {
  font-family: "Courier New", Courier, monospace;  /* Prioritize Courier New, fallback to system monospace */
  font-weight: bold;
  font-size: 18px;
  background-color: #f0f0f0;  /* Light gray background */
  color: blue;
  white-space: pre;  /* Preserve whitespace formatting */
}
/* Dark Theme Styles */
body.dark-mode .code-text-box {
  border: 1px solid #cccccc;
  background-color: #0f0f0f;  /* Dark gray background */
  padding: 25px;
  margin-left: 5px;
  margin-right: 5px;
  margin-top: 10px;
  margin-bottom: 10px;  /* Add spacing between boxes */
  border-radius: 3px;  /* Slightly rounded corners */
  position: relative;
  display: inline-block;
  white-space: nowrap;  /* Prevent automatic line breaks */
  align-items: center;  /* for vertical centering */
}
body.dark-mode .code-text-box code {
  font-family: "Courier New", Courier, monospace;  /* Prioritize Courier New, fallback to system monospace */
  font-weight: bold;
  font-size: 18px;
  background-color: #0f0f0f;  /* Dark gray background */
  color: blue;
  white-space: pre;  /* Preserve whitespace formatting */
}`;

const TINY_FONT_CODE_BOX_STYLE = `
/* Theme-Agnostic Styles */
.code-text-box img {
  height: auto;
  max-width: 20px;
  margin-left: 0;
  margin-right: 0;
}
.code-text-box .copy-icon {
  position: absolute;
  width: 20%;
  bottom: 5px;
  right: 0px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
}
/* Default Light Theme Styles */
.code-text-box {
  border: 1px solid #cccccc;
  background-color: #f0f0f0;  /* Light gray background */
  padding: 25px;
  margin-left: 5px;
  margin-right: 5px;
  margin-top: 10px;
  margin-bottom: 10px;  /* Add spacing between boxes */
  border-radius: 3px;  /* Slightly rounded corners */
  border-color: #f0f0ff;
  position: relative;
  display: inline-block;
  white-space: nowrap;  /* Prevent automatic line breaks */
  align-items: center;  * for vertical centering */
}
.code-text-box code {
  font-family: "Courier New", Courier, monospace;  /* Prioritize Courier New, fallback to system monospace */
  font-weight: bold;
  font-size: 5px;
  background-color: #f0f0f0;  /* Light gray background */
  color: blue;
  white-space: pre;  /* Preserve whitespace formatting */
}
/* Dark Theme Styles */
body.dark-mode .code-text-box {
  border: 1px solid #cccccc;
  background-color: #0f0f0f;  /* Dark gray background */
  padding: 25px;
  margin-left: 5px;
  margin-right: 5px;
  margin-top: 10px;
  margin-bottom: 10px;  /* Add spacing between boxes */
  border-radius: 3px;  /* Slightly rounded corners */
  position: relative;
  display: inline-block;
  white-space: nowrap;  /* Prevent automatic line breaks */
  align-items: center;  /* for vertical centering */
}
body.dark-mode .code-text-box code {
  font-family: "Courier New", Courier, monospace;  /* Prioritize Courier New, fallback to system monospace */
  font-weight: bold;
  font-size: 5px;
  background-color: #0f0f0f;  /* Dark gray background */
  color: blue;
  white-space: pre;  /* Preserve whitespace formatting */
}`;

class CodeBox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.codeBoxDiv = document.createElement('div');
    this.codeBoxDiv.classList.add('code-text-box');
  }
  
  connectedCallback() { 
    const code = document.createElement('code');
    code.textContent = this.textContent;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" || mutation.type === "characterData") {
          const code = this.shadowRoot.querySelector('code');
          if (code) {
            code.textContent = this.textContent;
          } else {
            console.error('Code element not found');
          }
        }
      });
    });
    observer.observe(this, { childList: true, subtree: true, characterData: true });
    const span = document.createElement('span');
    span.classList.add('copy-icon');
    const img = document.createElement('img');
    img.src = "https://cdn.glitch.global/3fefe35b-bbb3-4e52-b0f1-f94d09bc62e4/clipboard-icon.png?v=1709954958144";
    img.alt = "copy icon";
    span.appendChild(img);
    this.codeBoxDiv.appendChild(code);
    this.codeBoxDiv.appendChild(span);
    const style = document.createElement('style');
    style.textContent = CODE_BOX_STYLE;

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(this.codeBoxDiv);
    
    const copyIcon = this.shadowRoot.querySelector('.copy-icon');
    copyIcon.addEventListener('click', () => {
      const textToCopy = this.textContent.trim();
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          console.log('Text copied: ', textToCopy);
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
        });
    });
  }
}

class TinyFontCodeBox extends CodeBox {
  constructor() {
    super();
  }
  
  connectedCallback() {
    super.connectedCallback();
    const style = this.shadowRoot.querySelector('style');
    style.textContent = TINY_FONT_CODE_BOX_STYLE;
  }
}

customElements.define('code-box', CodeBox);
customElements.define('tiny-font-code-box', TinyFontCodeBox);

function displayScriptInCodeBoxAfterElement(scriptId, elementId) {
  const scriptElement = document.getElementById(scriptId);
  if (!scriptElement) {
    console.error(`Script with ID '${scriptId}' not found.`);
    return;
  }
  const placementElement = document.getElementById(elementId);
  if (! placementElement) {
    console.error(`Element with ID '${elementId}' not found.`);
    return;
  }
  const codeBox = document.createElement('code-box'); 
  codeBox.textContent = scriptElement.textContent;
   if (placementElement.nextSibling) {
    placementElement.parentNode.insertBefore(codeBox, placementElement.nextSibling); 
  } else {
    placementElement.parentNode.appendChild(codeBox);
  }
}

function displayHTMLTagInCodeBoxAfterElement(tagId, elementId) {
  const tagElement = document.getElementById(tagId);
  if (!tagElement) {
    console.error(`Tag with ID '${tagId}' not found.`);
    return;
  }
  const placementElement = document.getElementById(elementId);
  if (!placementElement) {
    console.error(`Element with ID '${elementId}' not found.`);
    return;
  }
  const codeBox = document.createElement('code-box'); 
  codeBox.textContent = tagElement.outerHTML
    .replace(/ id="[^"]*"/, '')
    .replace(/sharedstoragewritable=""/g, 'sharedstoragewritable')
    .replace('&amp;theme=dark', '')
    .replace('&amp;theme=light', '');
   if (placementElement.nextSibling) {
    placementElement.parentNode.insertBefore(codeBox, placementElement.nextSibling); 
  } else {
    placementElement.parentNode.appendChild(codeBox);
  }
}
import './style.css';
import { Eliza } from './eliza.js';

const app = document.querySelector('#app');

app.innerHTML = `
  <main class="app-shell">
    <section class="chat-card" aria-labelledby="appTitle">
      <header class="chat-header">
        <div class="brand-block">
          <p class="eyebrow">Classic chatbot</p>
          <h1 id="appTitle">ELIZA</h1>
          <p class="subtitle">Browser JavaScript port of a rule-based dialogue system.</p>
        </div>

        <div class="header-side">
          <p id="statusText" class="status" aria-live="polite">Starting...</p>
          <div class="chip-row" aria-label="Project details">
            
            <span class="chip">No AI API</span>
            
          </div>
        </div>
      </header>

      <div id="chatLog" class="chat-log" aria-live="polite"></div>

      <form id="chatForm" class="chat-form">
        <label class="sr-only" for="userInput">Your message</label>
        <input
          id="userInput"
          class="chat-input"
          type="text"
          autocomplete="off"
          placeholder="Type your message..."
          maxlength="240"
          disabled
        />
        <button id="sendButton" class="send-button" type="submit" disabled>Send</button>
        <button id="resetChat" class="reset-button" type="button" disabled>Reset</button>
      </form>

      <footer class="chat-footer">
        <span>Press Enter to send.</span>
        <span>ELIZA runs locally in your browser.</span>
      </footer>
    </section>
  </main>
`;

const chatLog = document.querySelector('#chatLog');
const form = document.querySelector('#chatForm');
const input = document.querySelector('#userInput');
const sendButton = document.querySelector('#sendButton');
const resetButton = document.querySelector('#resetChat');
const statusText = document.querySelector('#statusText');

let eliza = null;
let isWaitingForReply = false;

function formatTime() {
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

function addMessage(text, role) {
  const item = document.createElement('article');
  item.className = `message message--${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'message__bubble';
  bubble.textContent = text;

  const meta = document.createElement('p');
  meta.className = 'message__meta';
  meta.textContent = `${role === 'bot' ? 'ELIZA' : 'You'} · ${formatTime()}`;

  item.append(bubble, meta);
  chatLog.append(item);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function addTypingMessage() {
  const item = document.createElement('article');
  item.className = 'message message--bot message--typing';
  item.innerHTML = `
    <div class="message__bubble typing-dots" aria-label="ELIZA is typing">
      <span></span><span></span><span></span>
    </div>
  `;
  chatLog.append(item);
  chatLog.scrollTop = chatLog.scrollHeight;
  return item;
}

function setControlsEnabled(enabled) {
  input.disabled = !enabled;
  sendButton.disabled = !enabled;
  resetButton.disabled = false;
}

async function loadEliza() {
  statusText.textContent = 'Loading script...';
  chatLog.textContent = '';
  eliza = null;
  isWaitingForReply = false;
  input.value = '';
  input.disabled = true;
  sendButton.disabled = true;
  resetButton.disabled = true;

  const scriptUrl = `${import.meta.env.BASE_URL}data/eliza.script`;
  const response = await fetch(scriptUrl);

  if (!response.ok) {
    throw new Error(`Cannot load ELIZA script: ${response.status}`);
  }

  const scriptText = await response.text();
  eliza = new Eliza();
  eliza.readScript(scriptText);

  addMessage(eliza.initial || 'Hello.', 'bot');
  statusText.textContent = 'Ready';
  setControlsEnabled(true);
  input.focus();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const value = input.value.trim();
  if (!value || !eliza || isWaitingForReply || eliza.finished) return;

  addMessage(value, 'user');
  input.value = '';
  isWaitingForReply = true;
  input.disabled = true;
  sendButton.disabled = true;
  statusText.textContent = 'Thinking...';

  const typingMessage = addTypingMessage();

  window.setTimeout(() => {
    typingMessage.remove();

    const answer = eliza.processInput(value);
    addMessage(answer, 'bot');

    isWaitingForReply = false;

    if (eliza.finished) {
      input.disabled = true;
      sendButton.disabled = true;
      statusText.textContent = 'Conversation finished';
      return;
    }

    statusText.textContent = 'Ready';
    input.disabled = false;
    sendButton.disabled = false;
    input.focus();
  }, 320);
});

resetButton.addEventListener('click', () => {
  loadEliza().catch(showError);
});

function showError(error) {
  console.error(error);
  statusText.textContent = 'Error';
  resetButton.disabled = false;
  addMessage('Cannot load ELIZA script from public/data/eliza.script.', 'bot');
}

loadEliza().catch(showError);

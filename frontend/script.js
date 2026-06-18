const MAX_CHARS = 500;
const STORAGE_KEY = "anubhavi_thread";

const input = document.getElementById("input");
const chat = document.getElementById("chat-container");
const askBtn = document.getElementById("ask");
const charCount = document.getElementById("char-count");
const offlineBanner = document.getElementById("offline-banner");

// Restore or create threadId from localStorage
let threadId = localStorage.getItem(STORAGE_KEY);
if (!threadId) {
  threadId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  localStorage.setItem(STORAGE_KEY, threadId);
}

input.addEventListener("keydown", handleEnter);
input.addEventListener("input", onInput);
askBtn.addEventListener("click", handleAsk);

function onInput() {
  autoGrow();
  const len = input.value.length;
  charCount.textContent = `${len} / ${MAX_CHARS}`;
  charCount.classList.toggle("text-red-400", len >= MAX_CHARS);
  charCount.classList.toggle("text-gray-400", len < MAX_CHARS);
  if (len > MAX_CHARS) {
    input.value = input.value.slice(0, MAX_CHARS);
  }
}

function autoGrow() {
  input.style.height = "auto";
  input.style.height = input.scrollHeight + "px";
}

function setLoading(on) {
  input.disabled = on;
  askBtn.disabled = on;
  askBtn.textContent = on ? "..." : "Ask";
}

function shakeInput() {
  const box = document.getElementById("input-box");
  box.classList.remove("shake");
  void box.offsetWidth;
  box.classList.add("shake");
}

async function checkHealth() {
  try {
    const res = await fetch("http://localhost:3000/");
    offlineBanner.classList.toggle("hidden", res.ok);
  } catch {
    offlineBanner.classList.remove("hidden");
  }
}

async function callServer(text) {
  const response = await fetch("http://localhost:3000/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: text, threadId }),
  });
  if (!response.ok) throw new Error("Server error");
  const data = await response.json();
  return data.result;
}

function createUserBubble(text) {
  const wrapper = document.createElement("div");
  wrapper.className = "flex justify-end items-end gap-2 my-4";

  const bubble = document.createElement("div");
  bubble.className =
    "bg-indigo-500 text-white px-4 py-2 rounded-2xl rounded-br-sm max-w-xs text-sm";
  bubble.textContent = text;

  const avatar = document.createElement("div");
  avatar.className =
    "w-8 h-8 rounded-full bg-indigo-300 text-indigo-900 flex items-center justify-center text-xs font-bold shrink-0";
  avatar.textContent = "You";

  wrapper.appendChild(bubble);
  wrapper.appendChild(avatar);
  return wrapper;
}

function createBotBubble() {
  const wrapper = document.createElement("div");
  wrapper.className = "flex justify-start items-start gap-2 my-4";

  const avatar = document.createElement("div");
  avatar.className =
    "w-8 h-8 rounded-full bg-violet-400 text-violet-900 flex items-center justify-center text-xs font-bold shrink-0 mt-1";
  avatar.textContent = "AI";

  const inner = document.createElement("div");
  inner.className = "flex flex-col gap-1 max-w-xl";

  const label = document.createElement("span");
  label.className = "text-violet-300 text-xs ml-1";
  label.textContent = "Anubhavi";

  const bubble = document.createElement("div");
  bubble.className =
    "bg-violet-800 text-white px-4 py-3 rounded-2xl rounded-tl-sm text-sm md-body";
  bubble.innerHTML = `<span class="animate-pulse text-violet-300">Thinking...</span>`;

  inner.appendChild(label);
  inner.appendChild(bubble);
  wrapper.appendChild(avatar);
  wrapper.appendChild(inner);
  return { wrapper, bubble };
}

function showWelcome() {
  const { wrapper, bubble } = createBotBubble();
  bubble.innerHTML = marked.parse(
    "Namaste! I'm **Anubhavi**, your mindful companion. How may I assist you today?"
  );
  chat.appendChild(wrapper);
}

async function generateText(text) {
  chat.appendChild(createUserBubble(text));
  input.value = "";
  charCount.textContent = `0 / ${MAX_CHARS}`;
  autoGrow();
  setLoading(true);

  const { wrapper, bubble } = createBotBubble();
  chat.appendChild(wrapper);
  wrapper.scrollIntoView({ behavior: "smooth" });

  try {
    const llmResponse = await callServer(text);
    bubble.innerHTML = marked.parse(llmResponse);
    offlineBanner.classList.add("hidden");
  } catch {
    bubble.innerHTML = `<span class="text-red-300">Something went wrong. Try again.</span>`;
    offlineBanner.classList.remove("hidden");
  }

  setLoading(false);
  wrapper.scrollIntoView({ behavior: "smooth" });
  input.focus();
}

async function handleAsk() {
  const text = input?.value.trim();
  if (!text) {
    shakeInput();
    return;
  }
  await generateText(text);
}

async function handleEnter(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const text = input?.value?.trim();
    if (!text) {
      shakeInput();
      return;
    }
    await generateText(text);
  }
}

checkHealth();
showWelcome();

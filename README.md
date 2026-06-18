# Anubhavi — AI Chat Assistant

A minimal AI chatbot powered by Groq and Tavily web search. Ask anything — Anubhavi answers from its own knowledge or searches the internet in real time when needed.

![Anubhavi Chat UI](https://placehold.co/800x400/4c1d95/ffffff?text=Anubhavi+Chatbot)

## Features

- Real-time web search via Tavily when the answer needs up-to-date information
- Multi-turn conversation memory per session (persisted across page refreshes)
- Markdown rendering for structured responses (tables, lists, headings, bold)
- Typing indicator while the model is thinking
- 500-character input limit with live counter
- Server health banner if the backend is offline

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS, Tailwind CSS v4, Marked.js |
| Backend | Node.js, Express |
| LLM | Groq API (`openai/gpt-oss-20b`) |
| Web Search | Tavily API |
| Session Cache | node-cache (in-memory, 24h TTL) |

## Project Structure

```
chatgpt-mini/
├── backend/
│   └── index.js        # Express server, /chat endpoint
├── frontend/
│   ├── index.html      # UI markup
│   └── script.js       # Chat logic, DOM, localStorage
├── llm/
│   └── index.js        # Groq tool-call loop + Tavily web search
├── .env.example        # Required environment variables
└── package.json
```

## Getting Started

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd chatgpt-mini
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your API keys:

```env
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
```

- Get a Groq key: https://console.groq.com
- Get a Tavily key: https://app.tavily.com

### 4. Start the backend

```bash
npm start
```

The server starts at `http://localhost:3000`.

### 5. Open the frontend

Open `frontend/index.html` directly in your browser, or serve it with any static file server:

```bash
npx serve frontend
```

## API

### `POST /chat`

Sends a message and returns the AI response.

**Request body**
```json
{
  "message": "Who is the PM of India?",
  "threadId": "abc123"
}
```

**Response**
```json
{
  "status": "SUCCESS",
  "result": "The current Prime Minister of India is Narendra Modi..."
}
```

**Error response**
```json
{
  "status": "FAILURE",
  "result": "Server error"
}
```

## How It Works

1. The frontend sends the user's message along with a `threadId` (stored in `localStorage`) to the backend.
2. The backend calls `askLLM` in the LLM layer with the message and thread ID.
3. `askLLM` loads the conversation history for that thread from the in-memory cache, then runs a tool-call loop with the Groq model (up to 10 turns).
4. If the model decides it needs real-time data, it calls `webSearch` via Tavily and feeds the results back into the conversation.
5. Once the model produces a final text response, it's saved back to the cache and returned to the frontend.
6. The frontend renders the response as Markdown.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | API key for Groq LLM inference |
| `TAVILY_API_KEY` | API key for Tavily web search |

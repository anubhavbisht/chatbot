# LLM Invoke — AI Chat Assistant with Web Search

An interactive command-line AI assistant that can search the web in real time to answer your questions. Built with **Groq** (LLM) and **Tavily** (web search).

## What it does

You chat with the assistant in your terminal. When a question needs up-to-date information (news, prices, recent events), the assistant automatically searches the web and uses those results to answer you — all in one conversation.

```
You:: When was the iPhone 16 launched?
[webSearch] "iPhone 16 launch date"
Assistant:: The iPhone 16 was launched on September 9, 2024...

You:: What about its price?
Assistant:: The iPhone 16 starts at $799...
```

The assistant remembers everything said earlier in the session, so you can ask follow-up questions naturally.

## How it works (the agentic loop)

This project implements a pattern called an **agentic loop** — a core concept in AI engineering:

```
User message
     ↓
  LLM decides: do I need more info?
     ↓              ↓
   YES             NO
  Call tool      Reply to user
  (webSearch)        ↓
     ↓            Done
  Feed result
  back to LLM
     ↓
  (repeat)
```

The LLM (language model) is given a set of tools it can call. If it decides a tool is needed, your code runs the tool and sends the result back. This loop continues until the LLM has everything it needs to answer.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A [Groq API key](https://console.groq.com/) — free tier available
- A [Tavily API key](https://tavily.com/) — free tier available

## Setup

1. **Clone the repo**
   ```bash
   git clone <your-repo-url>
   cd llm-invoke
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the project root:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   TAVILY_API_KEY=your_tavily_api_key_here
   ```

## Run

```bash
node app.js
```

Type your question and press Enter. Type `exit` to quit.

## Project structure

```
llm-invoke/
├── app.js        # All application logic
├── .env          # API keys (never commit this)
├── package.json
└── README.md
```

## Tech stack

| Tool | Purpose |
|---|---|
| [Groq SDK](https://github.com/groq/groq-node) | Fast LLM inference (runs the AI model) |
| [Tavily](https://tavily.com/) | Real-time web search API |
| [dotenv](https://github.com/motdotla/dotenv) | Loads API keys from `.env` file |

## Important: keep your API keys safe

Never commit your `.env` file to git. Add it to `.gitignore`:

```bash
echo ".env" >> .gitignore
```

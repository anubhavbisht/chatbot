import "dotenv/config";
import { tavily } from "@tavily/core";
import Groq from "groq-sdk";
import NodeCache from "@cacheable/node-cache";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MAX_TURNS = 10;

const cache = new NodeCache({
  stdTTL: 60 * 60 * 24,
  maxKeys: 500,
});

async function webSearch({ query }) {
  console.log(`[webSearch] "${query}"`);
  const response = await tvly.search(query);
  if (!response.results?.length) return "No results found.";
  return response.results.map((res) => res.content).join("\n\n");
}

export async function getGroqChatCompletion(messages) {
  return groq.chat.completions.create({
    messages,
    tools: [
      {
        type: "function",
        function: {
          name: "webSearch",
          description:
            "Search the latest information and realtime data on internet.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query to search on",
              },
            },
            required: ["query"],
          },
        },
      },
    ],
    tool_choice: "auto",
    model: "openai/gpt-oss-20b",
  });
}

export async function askLLM(userQuestion, threadId) {
  const baseMessages = [
    {
      role: "system",
      content: `You are Anubhavi, a personal assistant who answers asked question.
          You have monk nature and have worldly knowledge.
          If you know the answer to a question, answer it directly in plain English.
          If the answer requires real-time, local, or up-to-date information, or if you don’t know the answer, use the available tools to find it.
          You have access to the following tool:
          webSearch(query: string): Use this to search the internet for current or unknown information.
          Decide when to use your own knowledge and when to use the tool.
          Do not mention the tool unless needed.

          Examples:
          Q: What is the capital of France?
          A: The capital of France is Paris.

          Q: What's the weather in Mumbai right now?
          A: (use the search tool to find the latest weather)

          Q: Who is the Prime Minister of India?
          A: The current Prime Minister of India is Narendra Modi.

          Q: Tell me the latest IT news.
          A: (use the search tool to get the latest news)

          current date and time: ${new Date().toUTCString()}`,
    },
  ];
  try {
    const messages = cache.get(threadId) ?? baseMessages;
    messages.push({
      role: "user",
      content: userQuestion,
    });
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const chatCompletion = await getGroqChatCompletion(messages);
      const message = chatCompletion.choices[0].message;
      const toolCalls = message.tool_calls;
      if (!toolCalls) {
        messages.push(message);
        cache.set(threadId, messages);
        return message.content;
      }

      messages.push(message);

      for (const tool of toolCalls) {
        const fnName = tool.function.name;
        const fnArgs = JSON.parse(tool.function.arguments);

        if (fnName === "webSearch") {
          const toolResult = await webSearch(fnArgs);
          messages.push({
            tool_call_id: tool.id,
            role: "tool",
            name: fnName,
            content: toolResult,
          });
        } else {
          messages.push({
            tool_call_id: tool.id,
            role: "tool",
            name: fnName,
            content: `Tool "${fnName}" is not available.`,
          });
        }
      }
    }
    console.log("Assistant:: Could not resolve in time, try rephrasing.");
    return "Could not resolve your question in time. Please try rephrasing.";
  } catch (e) {
    console.error("Error:", e.message);
    throw e;
  }
}

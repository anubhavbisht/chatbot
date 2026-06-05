import "dotenv/config";
import readline from "node:readline/promises";
import { tavily } from "@tavily/core";
import Groq from "groq-sdk";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MAX_TURNS = 10;

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

export async function main() {
  const messages = [
    {
      role: "system",
      content: `You are Anubhavi, a personal assistant who answers asked question.
           You have monk nature and have worldly knowledge.
           You have the access for the following tools:
           1. webSearch({query}: {query: string}) // Search the latest information and realtime data on internet.
           current datetime: ${new Date().toUTCString()}`,
    },
  ];
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  while (true) {
    try {
      const userQuestion = await rl.question("You::");
      if (userQuestion.trim().toLowerCase() === "exit") {
        break;
      }
      messages.push({
        role: "user",
        content: userQuestion,
      });
      let resolved = false;
      for (let turn = 0; turn < MAX_TURNS; turn++) {
        const chatCompletion = await getGroqChatCompletion(messages);
        const message = chatCompletion.choices[0].message;
        const toolCalls = message.tool_calls;

        if (!toolCalls) {
          messages.push(message);
          console.log("Assistant::", message.content);
          resolved = true;
          break;
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
          }
        }
      }
      if (!resolved) {
        console.log("Assistant:: Could not resolve in time, try rephrasing.");
      }
    } catch (e) {
      console.error("Error:", e.message);
    }
  }

  rl.close();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});

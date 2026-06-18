import express from "express";
import cors from "cors";
import { askLLM } from "../llm/index.js";

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
  res.send("Welocome to chatbot");
});

app.post("/chat", async (req, res) => {
  try {
    const { message, threadId } = req.body;
    if (!message || !threadId) {
      return res.status(400).json({
        status: "FAILURE",
        result: null,
        errMessage: "All required fields are not provided",
      });
    }
    const result = await askLLM(message.trim(), threadId);
    return res.json({
      status: "SUCCESS",
      result,
    });
  } catch (e) {
    return res.status(500).json({
      status: "FAILURE",
      result: "Server error",
    });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();


const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

async function test() {
  const response = await client.chat.completions.create({
   model: "meta-llama/llama-3-8b-instruct",
    messages: [
      { role: "user", content: "Write a short paragraph about AI." }
    ],
  });

  console.log(response.choices[0].message.content);
}

test();
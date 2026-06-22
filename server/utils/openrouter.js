// utils/openrouter.js

import OpenAI from "openai";

export const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Bhuddhimaan AI App",
  },
});

export const generateAI = async (prompt, maxTokens = 1000) => {
  const response = await openrouter.chat.completions.create({
    model: "meta-llama/llama-3-8b-instruct",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: maxTokens,
  });

  return response.choices[0].message.content;
};



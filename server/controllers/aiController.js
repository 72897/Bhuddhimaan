// server/controllers/aiController.js
import FormData from "form-data";
import axios from "axios";
import OpenAI from "openai";
import getSql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import fs from "fs";
import pdf from 'pdf-parse/lib/pdf-parse.js'
import xlsx from "xlsx";
import fetch from "node-fetch";

import dotenv from "dotenv";
dotenv.config();

// Only use Clerk when keys are configured
const hasClerkKeys = Boolean(process.env.CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY)

/** Build a data URL from the uploaded image (no network needed) */
function dataUrlFromUpload(buffer, mime) {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

/** Same, but with a tiny top-left overlay label (still 1 data URL) */
function svgWithImageAndBadge(buffer, mime, label = "") {
  const imgBase64 = buffer.toString("base64");
  const safe = (s) => String(s).replace(/[<&>"]/g, (c) => (
    { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]
  ));
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet">
  <defs/>
  <image href="data:${mime};base64,${imgBase64}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"/>
  <rect x="16" y="16" width="360" height="44" rx="8" ry="8" fill="black" opacity="0.45"/>
  <text x="36" y="46" fill="white" font-family="Arial, Helvetica, sans-serif" font-size="22">
    ${safe(label)}
  </text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}


if (!process.env.OPENROUTER_API_KEY) {
  console.warn("⚠ OPENROUTER_API_KEY not set");
}

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "missing-key-fallback",
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Bhuddhimaan AI App",
  },
});

const generateAI = async (prompt, maxTokens = 1000) => {
  try {
    const completion = await openrouter.chat.completions.create({
      model: "meta-llama/llama-3-8b-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: maxTokens,
    });

    return completion.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("OpenRouter Error:", error.message);

    // simple retry on rate limit
    if (error.status === 429) {
      await new Promise((res) => setTimeout(res, 4000));
      return generateAI(prompt, maxTokens);
    }

    throw error;
  }
};

// =========================================
// GENERATE ARTICLE
// =========================================




export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth || {};
    const { prompt, length } = req.body || {};
    const plan = req.plan;
    const freeUsage = req.free_usage ?? 0;

    if (!prompt)
      return res.status(400).json({
        success: false,
        error: "Prompt required",
      });

    if (plan !== "premium" && freeUsage >= 10)
      return res.json({
        success: false,
        error: "Free limit reached. Upgrade to premium.",
      });

    const content = await generateAI(
      prompt,
      Math.min(Number(length) || 1200, 2000)
    );

    const sql = getSql();
       if (sql && userId) {
         await sql`
           INSERT INTO creations (user_id, prompt, content, type)
           VALUES (${userId}, ${prompt}, ${content}, 'article')
         `;
       }
   
       if (hasClerkKeys && plan !== "premium" && userId) {
         await clerkClient.users.updateUser(userId, {
           privateMetadata: { free_usage: freeUsage + 1 },
         });
       }
   
       res.json({ success: true, content });
     } catch (error) {
       console.error("Generate Article Error:", error);
       res.status(500).json({ success: false, error: error.message });
     }
   };
   
// =========================================
// GENERATE BLOG TITLE
// =========================================

export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth || {};
    const { prompt } = req.body || {};
    const plan = req.plan;
    const freeUsage = req.free_usage ?? 0;

    if (!prompt)
      return res.status(400).json({
        success: false,
        error: "Prompt required",
      });

    if (plan !== "premium" && freeUsage >= 10)
      return res.json({
        success: false,
        error: "Free limit reached.",
      });

    const content = await generateAI(prompt, 150);

    const sql = getSql();
       if (sql && userId) {
         await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'blog_title')`;
       }
   
       if (hasClerkKeys && plan !== "premium" && userId) {
         await updateUsage(userId, plan, freeUsage);
       }
   
       res.json({ success: true, content });
     } catch (error) {
       res.status(500).json({ success: false, error: error.message });
     }
   };

// =========================================
// GENERATE WEBSITE
// =========================================

export const generateWebsite = async (req, res) => {
  try {
    const { userId } = req.auth || {};
    const { prompt } = req.body || {};
    const plan = req.plan;
    const freeUsage = req.free_usage ?? 0;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt required",
      });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({
        success: false,
        error: "Prompt too long",
      });
    }

    if (plan !== "premium" && freeUsage >= 10) {
      return res.status(403).json({
        success: false,
        error: "Free limit reached.",
      });
    }

    const enhancedPrompt = `
Generate a complete responsive website.

STRICT RULES:
- Output ONLY raw HTML
- No markdown or backticks
- Use "class" NOT "className"
- No React, JSX, or fragments
- Include full HTML structure (<html>, <head>, <body>)
- Include Tailwind CDN:
<script src="https://cdn.tailwindcss.com"></script>
- No comments or explanations
- Must be valid HTML

Description:
${prompt}
`;

    function cleanOutput(raw) {
      if (!raw) return "";

      // Extract from markdown if exists
      const match = raw.match(/```(?:html)?([\s\S]*?)```/i);
      if (match) raw = match[1];

      // Fix common issues
      raw = raw.replace(/className=/g, "class=");
      raw = raw.replace(/<>|<\/>/g, "");
      raw = raw.replace(/export\s+default\s+/g, "");

      return raw.trim();
    }

    const rawContent = await generateAI(enhancedPrompt, 3000);
    const content = cleanOutput(rawContent);

    if (!content.includes("<html") || !content.includes("</html>")) {
      return res.status(500).json({
        success: false,
        error: "Invalid HTML generated. Try again.",
      });
    }

    const sql = getSql();

    if (sql && userId) {
      await sql`
        INSERT INTO creations (user_id, prompt, content, type)
        VALUES (${userId}, ${prompt}, ${content}, 'generated_website')
      `;
    }

    if (hasClerkKeys && plan !== "premium" && userId) {
      await updateUsage(userId, plan, freeUsage);
    }

    res.json({ success: true, content });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//  Generate Image
export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth || {};
    const { prompt, publish } = req.body || {};
    const plan = req.plan;
    const freeUsage = req.free_usage ?? 0;

    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ success: false, error: "Missing GEMINI_API_KEY/GOOGLE_API_KEY" });
    }

    if (plan !== "premium" && freeUsage >= 10) {
      return res.json({ error: "Limit reached. Upgrade to premium plan for more usage." });
    }

    const formData = new FormData();
    formData.append("prompt", prompt || "shot of vaporwave fashion dog in miami");

    const { data } = await axios.post("https://clipdrop-api.co/text-to-image/v1", formData, {
      headers: {
        ...formData.getHeaders(),
        "x-api-key": process.env.CLIPDROP_API_KEY,
      },
      responseType: "arraybuffer",
    });

    const base64Image = `data:image/png;base64,${Buffer.from(data, "binary").toString("base64")}`;

    // Return the base64 image directly instead of uploading to Cloudinary
    console.log("Image generated successfully, size:", data.length);

    // Only try database operations if DATABASE_URL is configured
    const sql = getSql();
    if (sql) {
      try {
        await sql`
          INSERT INTO creations (user_id, prompt, content, type, publish)
          VALUES (${userId}, ${prompt}, ${base64Image}, 'image', ${publish ?? false})
        `;
        console.log("Database record created successfully");
      } catch (dbError) {
        console.log("Database operation failed, continuing without it:", dbError.message);
      }
    }

    if (hasClerkKeys && plan !== "premium" && userId) {
      try {
        await clerkClient.users.updateUser(userId, {
          privateMetadata: { free_usage: freeUsage + 1 },
        });
        console.log("Clerk usage updated successfully");
      } catch (clerkError) {
        console.log("Clerk operation failed, continuing without it:", clerkError.message);
      }
    }

    res.json({ success: true, content: base64Image });
  } catch (error) {
    console.error("Generate image error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate image"
    });
  }
};


export const removeImageBackground = async (req, res) => {
  const { userId } = req.auth || {};
  const image = req.file;
  const plan = req.plan;
  const freeUsage = req.free_usage ?? 0;

  console.log("🔍 RemoveImageBackground Debug:");
  console.log("  - Has API Key:", !!process.env.REMOVEBG_API_KEY);
  console.log("  - Has image:", !!image);

  // ❌ No image
  if (!image) {
    return res.status(200).json({
      success: false,
      message: "No image uploaded",
    });
  }

  // ❌ Free limit
  if (plan !== "premium" && freeUsage >= 10) {
    const buf = fs.readFileSync(image.path);
    return res.status(200).json({
      success: true,
      kind: "mock",
      message: "Free limit reached",
      content: `data:${image.mimetype};base64,${buf.toString("base64")}`,
    });
  }

  // ❌ No API key → mock
  if (!process.env.REMOVEBG_API_KEY) {
    const buf = fs.readFileSync(image.path);
    const mock = `data:${image.mimetype};base64,${buf.toString("base64")}`;

    return res.status(200).json({
      success: true,
      kind: "mock",
      message: "API key missing",
      content: mock,
    });
  }

  try {
    const formData = new FormData();
    formData.append("size", "auto");
    formData.append("image_file", fs.createReadStream(image.path));

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.REMOVEBG_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status}: ${text}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const resultImage = `data:image/png;base64,${base64}`;

    // Save + usage update
    await saveToDatabase(userId, "Remove Background from image", resultImage);
    await updateUsage(userId, plan, freeUsage);

    return res.status(200).json({
      success: true,
      kind: "real",
      content: resultImage,
    });

  } catch (error) {
    console.error("❌ remove.bg error:", error.message);

    // fallback mock
    const buf = fs.readFileSync(image.path);
    const mock = `data:${image.mimetype};base64,${buf.toString("base64")}`;

    return res.status(200).json({
      success: true,
      kind: "mock",
      message: "remove.bg failed, returning original image",
      content: mock,
      error: error.message,
    });
  }
};




// removeImageObject
export const removeImageObject = async (req, res) => {
  const { userId } = req.auth || {};
  const { object } = req.body || {};
  const image = req.file;
  const plan = req.plan;
  const freeUsage = req.free_usage ?? 0;

  console.log("🔍 AI Object Removal Debug:");
  console.log("  - Has API Key:", !!process.env.OPENAI_API_KEY);
  console.log("  - Object:", object);
  console.log("  - Has image:", !!image);
  console.log("  - Mimetype:", image?.mimetype);

  if (!image) {
    return res.status(200).json({ success: false, message: "No image uploaded" });
  }

  if (!object || !object.trim()) {
    return res.status(200).json({ success: false, message: "Please specify what to remove" });
  }

  try {
    const form = new FormData();

    form.append("model", "gpt-image-1");

    // ✅ FIX: pass filename + mimetype
    form.append("image[]", fs.createReadStream(image.path), {
      filename: image.originalname || "image.png",
      contentType: image.mimetype, // 🔥 THIS FIXES YOUR ERROR
    });

    form.append(
      "prompt",
      `Remove the ${object} from the image and reconstruct the background naturally with no artifacts.`
    );

    form.append("size", "1024x1024");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status}: ${text}`);
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) throw new Error("No image returned");

    await saveToDatabase(userId, `Removed ${object}`, imageUrl);
    await updateUsage(userId, plan, freeUsage);

    return res.status(200).json({
      success: true,
      kind: "real",
      content: imageUrl,
    });

  } catch (error) {
    console.error("❌ AI removal error:", error.message);

    const buf = fs.readFileSync(image.path);

    return res.status(200).json({
      success: true,
      kind: "mock",
      content: `data:${image.mimetype};base64,${buf.toString("base64")}`,
      error: error.message,
    });
  }
};

// Helper function to save to database
async function saveToDatabase(userId, prompt, content) {
  const sql = getSql();
  if (sql) {
    try {
      await sql`
        INSERT INTO creations (user_id, prompt, content, type)
        VALUES (${userId}, ${prompt}, ${content}, 'image')
      `;
      console.log("Database record created successfully");
    } catch (dbError) {
      console.log("Database operation failed, continuing without it:", dbError.message);
    }
  } else {
    console.log("No DATABASE_URL configured, skipping database operation");
  }
}

// Helper function to update usage
async function updateUsage(userId, plan, freeUsage) {
  if (hasClerkKeys && plan !== "premium" && userId) {
    try {
      await clerkClient.users.updateUser(userId, {
        privateMetadata: { free_usage: freeUsage + 1 },
      });
      console.log("Clerk usage updated successfully");
    } catch (clerkError) {
      console.log("Clerk operation failed, continuing without it:", clerkError.message);
    }
  } else {
    console.log("Clerk not configured or premium user, skipping usage update");
  }
}

 // Assuming you have these helpers

export const resumeReview = async (req, res) => {
  try {
    const resume = req.file;

    // Check for file existence
    if (!resume) {
      return res.status(400).json({
        success: false,
        error: "No resume uploaded",
      });
    }

    // Validate MIME type (only PDF allowed)
    if (resume.mimetype !== "application/pdf") {
      return res.status(400).json({
        success: false,
        error: "Only PDF supported",
      });
    }

    // Log file details for debugging
    console.log("🔍 ResumeReview Debug:");
    console.log("  - File details:", {
      filename: resume.filename,
      size: resume.size,
      mimetype: resume.mimetype,
      path: resume.path
    });

    // Read and parse PDF file
    const dataBuffer = fs.readFileSync(resume.path);
    const pdfData = await pdf(dataBuffer);
    fs.unlinkSync(resume.path);  // Clean up temporary file

    const text = pdfData.text;

    // Check for empty content in PDF
    if (!text.trim()) {
      return res.status(400).json({
        success: false,
        error: "Empty PDF",
      });
    }

    // Prepare prompt for AI processing
    const prompt = `
Review this resume and provide:

1. Overall Impression
2. Strengths
3. Weaknesses
4. Recommendations

Resume Content:
${text}
`;

    // Try API Layer first if available
    let content = "";
    if (process.env.APILAYER_KEY) {
      try {
        console.log("  - Calling API Layer for resume review...");
        const apiLayerResponse = await axios.post(
          "https://api.apilayer.com/resume/review",
          { text },
          {
            headers: {
              apikey: process.env.APILAYER_KEY,
              "Content-Type": "application/json",
            },
            timeout: 30000,
          }
        );

        content = apiLayerResponse.data?.review || apiLayerResponse.data?.feedback || JSON.stringify(apiLayerResponse.data);
        console.log("  - API Layer response received, content length:", content.length);
      } catch (apiLayerError) {
        console.log("  - API Layer failed, using fallback analysis:", apiLayerError.message);
      }
    }

    // Fallback basic analysis if no API Layer response
    if (!content) {
      console.log("  - Using fallback analysis");

      content = `## Resume Analysis for ${resume.filename}

### Overall Impression
Based on the uploaded resume, here's a comprehensive analysis of your document.

### Strengths
- **Clear Structure**: Your resume follows a logical format.
- **Professional Presentation**: The layout appears well-organized.
- **Relevant Content**: The document contains appropriate sections for a professional resume.

### Weaknesses
- **Content Analysis**: Unable to provide specific feedback without AI processing.
- **Keyword Optimization**: Consider tailoring keywords for specific job roles.
- **Achievement Quantification**: Ensure measurable achievements are highlighted.

### Recommendations
1. **Customize for Each Role**: Tailor your resume for specific job applications.
2. **Use Action Verbs**: Start bullet points with strong action verbs.
3. **Quantify Achievements**: Include specific numbers and metrics where possible.
4. **Proofread Thoroughly**: Ensure no spelling or grammatical errors.
5. **Keep it Concise**: Aim for 1-2 pages maximum.

### Next Steps
- Consider using professional resume review services.
- Have multiple people review your resume.
- Update regularly with new experiences and skills.

*Note: This is a basic analysis. For more detailed feedback, ensure your AI API keys are properly configured.*
`;
    }

    // Save review content to database
    const sql = getSql();
    if (sql) {
      try {
        await sql`
          INSERT INTO creations (user_id, prompt, content, type)
          VALUES (${req.auth?.userId}, 'Review the uploaded resume', ${content}, 'resume-review')
        `;
        console.log("  - Database record created successfully");
      } catch (dbError) {
        console.log("  - Database operation failed, continuing without it:", dbError.message);
      }
    }

    console.log("  - Resume review completed successfully");
    res.json({ success: true, content });
  } catch (error) {
    console.error("❌ ResumeReview Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error during resume review",
    });
  }
};


export const generateExcelChart = async (req, res) => {
  try {
    const { userId } = req.auth || {};
    const { question } = req.body || {};
    const plan = req.plan;
    const freeUsage = req.free_usage ?? 0;

    if (!req.file)
      return res.status(400).json({
        success: false,
        error: "Excel file required",
      });

    if (!question)
      return res.status(400).json({
        success: false,
        error: "Question required",
      });

    if (plan !== "premium" && freeUsage >= 10)
      return res.json({
        success: false,
        error: "Free limit reached. Upgrade to premium.",
      });

    // Parse Excel
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (!data.length)
      return res.status(400).json({
        success: false,
        error: "Excel file is empty",
      });

    const columns = Object.keys(data[0]);
    const sample = data.slice(0, 10);

    // Strong JSON-only prompt
    const enhancedPrompt = `
You are a professional data analyst.
If dataset has more than 12 categories,
DO NOT use pie chart.
Use bar chart instead.
Dataset Columns:
${columns.join(", ")}

Sample Data:
${JSON.stringify(sample)}

User Question:
"${question}"

IMPORTANT:
Return ONLY pure JSON.
Do NOT include explanation.
Do NOT include markdown.
Do NOT include text before or after JSON.

Required format:

{
  "chartType": "bar | line | pie | area",
  "xAxis": "column_name",
  "yAxis": "column_name",
  "aggregation": "sum | avg | count | none",
  "title": "Chart title"
}
`;

    const rawContent = await generateAI(enhancedPrompt, 800);

    // Clean possible markdown
    const cleaned = rawContent
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let chartConfig;

    try {
      chartConfig = JSON.parse(cleaned);
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "AI returned invalid JSON",
      });
    }

    // Save to DB
    const sql = getSql();
    if (sql && userId) {
      await sql`
        INSERT INTO creations (user_id, prompt, content, type)
        VALUES (${userId}, ${question}, ${cleaned}, 'excel_chart')
      `;
    }

    if (hasClerkKeys && plan !== "premium" && userId) {
      await clerkClient.users.updateUser(userId, {
        privateMetadata: { free_usage: freeUsage + 1 },
      });
    }

    res.json({
      success: true,
      chartConfig,
      data,
    });
  } catch (error) {
    console.error("Generate Excel Chart Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};























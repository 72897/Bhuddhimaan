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
import { GoogleGenerativeAI } from "@google/generative-ai";

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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateGemini = async (prompt) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "";
  } catch (error) {
    console.error("Gemini Error:", error.message);
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

    const sql = getSql();
    let brandContext = "";
    if (sql && userId) {
      try {
        const brandProfile = await sql`SELECT * FROM brand_profiles WHERE user_id = ${userId}`;
        if (brandProfile.length > 0) {
          const bp = brandProfile[0];
          brandContext = `
STRICT BRANDING GUIDELINES:
- Brand Name: "${bp.brand_name}"
- Tone of Voice: "${bp.tone_of_voice}"
- Target Audience: "${bp.target_audience}"
- Primary Theme Color: "${bp.primary_color}"
- Secondary Theme Color: "${bp.secondary_color}"
- Brand Description: "${bp.brand_description}"
Please style the website using these colors (use Tailwind matching colors where appropriate, e.g. bg-[${bp.primary_color}], text-[${bp.primary_color}], border-[${bp.primary_color}], primary/secondary highlights) and align design elements to fit this brand.
`;
        }
      } catch (dbError) {
        console.log("Failed to fetch brand profile for website generation, continuing:", dbError.message);
      }
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
${brandContext}

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

// Modify website code based on element selector and user instruction
export const modifyWebsite = async (req, res) => {
  try {
    const { userId } = req.auth || {};
    const { code, element, instruction } = req.body || {};
    const plan = req.plan;
    const freeUsage = req.free_usage ?? 0;

    if (!code || !instruction) {
      return res.status(400).json({ success: false, error: "Code and Instruction required" });
    }

    if (plan !== "premium" && freeUsage >= 10) {
      return res.status(403).json({ success: false, error: "Free limit reached" });
    }

    const sql = getSql();
    let brandContext = "";
    if (sql && userId) {
      try {
        const brandProfile = await sql`SELECT * FROM brand_profiles WHERE user_id = ${userId}`;
        if (brandProfile.length > 0) {
          const bp = brandProfile[0];
          brandContext = `Style guidelines: Primary color: ${bp.primary_color}, Secondary color: ${bp.secondary_color}. Brand Name: ${bp.brand_name}.`;
        }
      } catch (e) {
        console.log("DB profile skip:", e.message);
      }
    }

    const enhancedPrompt = `
You are an expert web developer editing a website's code.

Current Website HTML Code:
\`\`\`html
${code}
\`\`\`

Target Element Details (if selected):
${element ? JSON.stringify(element) : "No specific element selected. Modify globally."}

User Instruction:
"${instruction}"

STRICT RULES:
- Output ONLY the fully updated, complete website HTML code.
- No explanations or comments.
- No markdown wrappers or backticks.
- Preserve the exact layout, structure, stylesheets, and CDN imports except for the requested modifications.
- Ensure the output is valid, complete HTML starting with <!DOCTYPE html> and ending with </html>.
${brandContext}
`;

    const rawContent = await generateAI(enhancedPrompt, 3000);
    
    // clean markdown blocks if the AI outputs backticks
    let content = rawContent.trim();
    const match = content.match(/```(?:html)?([\s\S]*?)```/i);
    if (match) content = match[1].trim();

    res.json({ success: true, content });
  } catch (error) {
    console.error("Modify Website Error:", error);
    res.status(500).json({ success: false, error: error.message });
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
    const { jd = "" } = req.body;

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
    console.log("🔍 ResumeReview Debug:", {
      filename: resume.filename,
      size: resume.size,
      mimetype: resume.mimetype,
      hasJd: !!jd
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

    const enhancedPrompt = `
You are an expert ATS (Applicant Tracking System) reviewer and hiring manager.
Analyze the following resume text.
${jd.trim() ? `Target Job Description:\n"""\n${jd}\n"""` : "Provide a general resume review."}

Resume Content:
"""
${text}
"""

Return ONLY a valid JSON object matching this structure:
{
  "atsScore": 85, 
  "matchAnalysis": "A short summary of how well the resume matches the job description...",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "missingKeywords": ["Keyword 1", "Keyword 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}

Do NOT include any markdown, backticks, or text before/after the JSON.
`;

    const rawContent = await generateAI(enhancedPrompt, 1500);
    
    // Clean possible markdown wrappers
    const cleaned = rawContent
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch (err) {
      console.warn("AI didn't return valid JSON, parsing fallback:", err.message);
      analysis = {
        atsScore: jd.trim() ? 50 : 70,
        matchAnalysis: "Failed to parse detailed AI JSON response. Below is the raw assessment.",
        strengths: ["Structure is readable"],
        weaknesses: ["AI review formatting error"],
        missingKeywords: ["N/A"],
        recommendations: [cleaned]
      };
    }

    // Save review content to database
    const sql = getSql();
    if (sql) {
      try {
        await sql`
          INSERT INTO creations (user_id, prompt, content, type)
          VALUES (${req.auth?.userId}, 'Review the uploaded resume', ${JSON.stringify(analysis)}, 'resume-review')
        `;
        console.log("  - Database record created successfully");
      } catch (dbError) {
        console.log("  - Database operation failed, continuing without it:", dbError.message);
      }
    }

    res.json({ success: true, content: analysis, resumeText: text });
  } catch (error) {
    console.error("❌ ResumeReview Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error during resume review",
    });
  }
};

export const tailorResume = async (req, res) => {
  try {
    const { userId } = req.auth || {};
    const { text, jd } = req.body || {};
    const plan = req.plan;
    const freeUsage = req.free_usage ?? 0;

    if (!text || !jd) {
      return res.status(400).json({ success: false, error: "Resume text and Job Description required" });
    }

    if (plan !== "premium" && freeUsage >= 10) {
      return res.status(403).json({ success: false, error: "Free limit reached" });
    }

    const enhancedPrompt = `
You are a professional resume writer. Rewrite the following resume content to align with the provided Job Description.

Target Job Description:
"""
${jd}
"""

Original Resume Content:
"""
${text}
"""

STRICT RULES:
- Rewrite the Summary and Professional Experience achievements to naturally incorporate missing keywords and highlight matching skills from the job description.
- Use strong action verbs and quantify achievements where possible (e.g. percentages, dollar values, time saved).
- Preserve the name, contact info, education, and dates exactly as they are.
- Output the rewritten resume in clean, professional Markdown.
- Do NOT include any commentary, intros, or markdown blocks (no backticks). Start directly with the resume text.
`;

    const content = await generateAI(enhancedPrompt, 2000);
    
    // Save to creations
    const sql = getSql();
    if (sql && userId) {
      await sql`
        INSERT INTO creations (user_id, prompt, content, type)
        VALUES (${userId}, 'Tailor resume for JD', ${content}, 'tailored-resume')
      `;
    }

    if (hasClerkKeys && plan !== "premium" && userId) {
      await updateUsage(userId, plan, freeUsage);
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error("Tailor Resume Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


export const generateExcelChart = async (req, res) => {
  try {
    const { userId } = req.auth || {};
    const { question, columns: bodyColumns, sample: bodySample, data: bodyData } = req.body || {};
    const plan = req.plan;
    const freeUsage = req.free_usage ?? 0;

    let columns = [];
    let sample = [];
    let data = [];

    if (req.file) {
      // Parse Excel upload
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      data = xlsx.utils.sheet_to_json(sheet);
      
      // Clean up temp file
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.log("Failed to clean up uploaded excel file:", err.message);
      }

      if (!data.length) {
        return res.status(400).json({ success: false, error: "Excel file is empty" });
      }

      columns = Object.keys(data[0]);
      sample = data.slice(0, 10);
    } else if (bodyColumns && bodySample) {
      // Conversational request
      columns = bodyColumns;
      sample = bodySample;
      data = bodyData || [];
    } else {
      return res.status(400).json({ success: false, error: "Excel file or data context required" });
    }

    if (!question) {
      return res.status(400).json({ success: false, error: "Question required" });
    }

    if (plan !== "premium" && freeUsage >= 10) {
      return res.status(403).json({ success: false, error: "Free limit reached." });
    }

    // Strong JSON-only prompt
    const enhancedPrompt = `
You are a professional data analyst.
Dataset Columns:
${columns.join(", ")}

Sample Data Structure:
${JSON.stringify(sample)}

User Question:
"${question}"

IMPORTANT:
Return ONLY a valid JSON block mapping this request to a chart description.
Required format:
{
  "chartType": "bar | line | pie | area",
  "xAxis": "column_name",
  "yAxis": "column_name",
  "aggregation": "sum | avg | count | none",
  "title": "A descriptive title for the chart",
  "insight": "A 1-sentence analytical insight about this query..."
}

Do NOT include any explanations, markdown, or text before/after the JSON.
`;

    const rawContent = await generateGemini(enhancedPrompt);
    const cleaned = rawContent
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let chartConfig;
    try {
      chartConfig = JSON.parse(cleaned);
    } catch (err) {
      return res.status(500).json({ success: false, error: "AI returned invalid JSON: " + cleaned });
    }

    // Save to DB
    const sql = getSql();
    if (sql && userId) {
      try {
        await sql`
          INSERT INTO creations (user_id, prompt, content, type)
          VALUES (${userId}, ${question}, ${cleaned}, 'excel_chart')
        `;
      } catch (dbError) {
        console.log("DB save failed:", dbError.message);
      }
    }

    if (hasClerkKeys && plan !== "premium" && userId) {
      await updateUsage(userId, plan, freeUsage);
    }

    res.json({
      success: true,
      chartConfig,
      columns,
      sample,
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

export const generateCampaign = async (req, res) => {
  try {
    const { userId } = req.auth || {};
    const { articleTitle, articleContent } = req.body || {};
    const plan = req.plan;
    const freeUsage = req.free_usage ?? 0;

    if (!articleContent) {
      return res.status(400).json({ success: false, error: "Article content is required" });
    }

    if (plan !== "premium" && freeUsage >= 10) {
      return res.status(403).json({ success: false, error: "Free limit reached. Upgrade to premium." });
    }

    // Retrieve Brand profile context if exists
    let brandContext = "";
    const sql = getSql();
    if (sql && userId) {
      try {
        const brandProfile = await sql`SELECT * FROM brand_profiles WHERE user_id = ${userId}`;
        if (brandProfile.length > 0) {
          const bp = brandProfile[0];
          brandContext = `
STRICT BRANDING GUIDELINES:
- Brand Name: "${bp.brand_name}"
- Target Audience: "${bp.target_audience}"
- Tone of Voice: "${bp.tone_of_voice}"
- Brand Description: "${bp.brand_description}"
Ensure the social media copy aligns perfectly with this brand's voice and tone.
`;
        }
      } catch (dbError) {
        console.log("Failed to fetch brand profile for campaign, continuing:", dbError.message);
      }
    }

    const enhancedPrompt = `
You are an expert social media marketer and content strategist.
Given the following article, generate a highly engaging multi-channel social media campaign.

Article Title: ${articleTitle || "Untitled"}
Article Content:
${articleContent}

${brandContext}

Please generate the campaign copy for the following channels:
1. LinkedIn Post: An engaging, thought-provoking hook, a structured summary of the key takeaways (using bullet points/emojis), and 3-5 relevant hashtags.
2. Twitter (X) Thread: A 3 to 5 tweet thread. The first tweet should be a hook to draw readers in. The subsequent tweets should expand on the key findings, and the final tweet should wrap it up with a call to action.
3. Instagram Caption: An engaging, visual caption with a summary, relevant emojis, and hashtags.

IMPORTANT:
Return ONLY a valid JSON block containing the generated campaign. Do NOT include any explanations, introductory text, markdown formatting blocks (like \`\`\`json), or text before/after the JSON.
Required format:
{
  "linkedin": "LinkedIn copy here",
  "twitter": ["Tweet 1 copy", "Tweet 2 copy", "Tweet 3 copy", "Tweet 4 copy", "Tweet 5 copy"],
  "instagram": "Instagram copy here"
}
`;

    const rawContent = await generateGemini(enhancedPrompt);
    const cleaned = rawContent
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let campaign;
    try {
      campaign = JSON.parse(cleaned);
    } catch (err) {
      return res.status(500).json({ success: false, error: "AI returned invalid JSON: " + cleaned });
    }

    // Save to DB
    if (sql && userId) {
      try {
        await sql`
          INSERT INTO creations (user_id, prompt, content, type)
          VALUES (${userId}, ${articleTitle || 'Social campaign'}, ${cleaned}, 'campaign')
        `;
      } catch (dbError) {
        console.log("DB save failed for campaign:", dbError.message);
      }
    }

    if (hasClerkKeys && plan !== "premium" && userId) {
      await updateUsage(userId, plan, freeUsage);
    }

    res.json({
      success: true,
      campaign
    });
  } catch (error) {
    console.error("Generate Campaign Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
























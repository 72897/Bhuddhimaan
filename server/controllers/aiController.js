// server/controllers/aiController.js
import FormData from "form-data";
import axios from "axios";
import OpenAI from "openai";
import getSql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import fs from "fs";
import pdf from 'pdf-parse/lib/pdf-parse.js'
import { GoogleGenerativeAI } from '@google/generative-ai';


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

let AI = null;

// Lazy initialization of AI client
const getAI = () => {
  if (!AI && (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
    AI = new OpenAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta",
    });
  }
  return AI;
};

//  Generate Full Article
export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth || {};
    const { prompt, length } = req.body || {};
    const plan = req.plan;
    const freeUsage = req.free_usage ?? 0;

    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ success: false, error: "Missing GEMINI_API_KEY/GOOGLE_API_KEY" });
    }

    if (plan !== "premium" && freeUsage >= 10) {
      return res.json({ error: "Limit reached. Upgrade to premium plan for more usage." });
    }

    const ai = getAI();
    if (!ai) {
      return res.status(500).json({ success: false, error: "Missing GEMINI_API_KEY/GOOGLE_API_KEY" });
    }

    const response = await ai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      ...(Number.isFinite(Number(length)) ? { max_tokens: Math.min(Number(length), 2000) } : {}),
    });

    const content = response.choices?.[0]?.message?.content || "";

    const sql = getSql();
    if (sql) {
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
    console.error(error);
    res.json({ success: false, error: error.message });
  }
};

//  Generate Blog Title
export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth || {};
    const { prompt } = req.body || {};
    const plan = req.plan;
    const freeUsage = req.free_usage ?? 0;

    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ success: false, error: "Missing GEMINI_API_KEY/GOOGLE_API_KEY" });
    }

    if (plan !== "premium" && freeUsage >= 10) {
      return res.json({ error: "Limit reached. Upgrade to premium plan for more usage." });
    }

    const ai = getAI();
    if (!ai) {
      return res.status(500).json({ success: false, error: "Missing GEMINI_API_KEY/GOOGLE_API_KEY" });
    }

    const response = await ai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
    });

    const content = response.choices?.[0]?.message?.content || "";

    const sql = getSql();
    if (sql) {
      await sql`
        INSERT INTO creations (user_id, prompt, content, type)
        VALUES (${userId}, ${prompt}, ${content}, 'blog_title')
      `;
    }

    if (hasClerkKeys && plan !== "premium" && userId) {
      await clerkClient.users.updateUser(userId, {
        privateMetadata: { free_usage: freeUsage + 1 },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error(error);
    res.json({ success: false, error: error.message });
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

  // Debug logging
  console.log("🔍 RemoveImageBackground Debug:");
  console.log("  - Has API Key:", !!process.env.CLIPDROP_API_KEY);
  console.log("  - Has image:", !!image);
  console.log("  - Plan:", plan);
  console.log("  - Free usage:", freeUsage);

  // Basic validations → still 200 with helpful message
  if (!image) {
    return res.status(200).json({
      success: false,
      kind: "mock",
      message: "No image uploaded; showing placeholder of your upload slot.",
      content: "data:image/svg+xml;base64,"
        + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="20" fill="#666">Upload an image first</text></svg>`).toString("base64")
    });
  }

  if (plan !== "premium" && freeUsage >= 10) {
    const buf = fs.readFileSync(image.path);
    return res.status(200).json({
      success: true,
      kind: "mock",
      message: "Free limit reached; returning your image (mock).",
      content: svgWithImageAndBadge(buf, image.mimetype, "Mock: background removed"),
    });
  }

  // If no API key → mock (show YOUR image, not a red box)
  if (!process.env.CLIPDROP_API_KEY) {
    const buf = fs.readFileSync(image.path);
    const mockUrl = svgWithImageAndBadge(buf, image.mimetype, "Mock: background removed");
    await saveToDatabase(userId, 'Remove Background from image (mock)', mockUrl);
    await updateUsage(userId, plan, freeUsage);
    return res.status(200).json({
      success: true,
      kind: "mock",
      message: "AndorAI not configured; returning mock built from your image.",
      content: mockUrl,
    });
  }

  // Try real AndorAI
  try {
    // 1) multipart form (preferred)
    const form = new FormData();
    form.append("image_file", fs.createReadStream(image.path));

    const r1 = await axios.post("https://clipdrop-api.co/remove-background/v1", form, {
      headers: { Authorization: `Bearer ${process.env.CLIPDROP_API_KEY}`, ...form.getHeaders() },
      timeout: 30000,
    });

    const url = r1.data?.output_url || r1.data?.url || r1.data?.image_url;
    if (url) {
      await saveToDatabase(userId, 'Remove Background from image', url);
      await updateUsage(userId, plan, freeUsage);
      return res.status(200).json({ success: true, kind: "real", content: url });
    }
    throw new Error("No image URL from AndorAI multipart call");
  } catch (e1) {
    // 2) fallback: base64 JSON
    try {
      const buf = fs.readFileSync(image.path);
      const b64 = buf.toString("base64");
      const r2 = await axios.post("https://clipdrop-api.co/remove-background/v1", {
        image: b64,
      }, {
        headers: { Authorization: `Bearer ${process.env.CLIPDROP_API_KEY}`, "Content-Type": "application/json" },
        timeout: 30000,
      });
      const url = r2.data?.output_url || r2.data?.url || r2.data?.image_url;
      if (url) {
        await saveToDatabase(userId, 'Remove Background from image', url);
        await updateUsage(userId, plan, freeUsage);
        return res.status(200).json({ success: true, kind: "real", content: url });
      }
      throw new Error("No image URL from AndorAI base64 call");
    } catch (e2) {
      // Final mock fallback — show YOUR image with a badge
      const buf = fs.readFileSync(image.path);
      const mockUrl = svgWithImageAndBadge(buf, image.mimetype, "Mock: background removed");
      await saveToDatabase(userId, 'Remove Background from image (mock)', mockUrl);
      await updateUsage(userId, plan, freeUsage);
      return res.status(200).json({
        success: true,
        kind: "mock",
        message: "AndorAI unavailable; returning mock built from your image.",
        content: mockUrl,
        details: { e1: e1?.message, e2: e2?.message }
      });
    }
  }
};




// removeImageObject
export const removeImageObject = async (req, res) => {
  const { userId } = req.auth || {};
  const { object } = req.body || {};
  const image = req.file;
  const plan = req.plan;
  const freeUsage = req.free_usage ?? 0;

  // Debug logging
  console.log("🔍 RemoveImageObject Debug:");
  console.log("  - Has API Key:", !!process.env.CLIPDROP_API_KEY);
  console.log("  - Object to remove:", object);
  console.log("  - Has image:", !!image);
  console.log("  - Plan:", plan);
  console.log("  - Free usage:", freeUsage);

  // Basic validations → still 200 with helpful message
  if (!image) {
    return res.status(200).json({
      success: false,
      kind: "mock",
      message: "No image uploaded; showing placeholder of your upload slot.",
      content: "data:image/svg+xml;base64,"
        + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="20" fill="#666">Upload an image first</text></svg>`).toString("base64")
    });
  }
  if (!object || !String(object).trim()) {
    const buf = fs.readFileSync(image.path);
    return res.status(200).json({
      success: false,
      kind: "mock",
      message: "No object specified; echoing your uploaded image.",
      content: dataUrlFromUpload(buf, image.mimetype),
    });
  }
  if (plan !== "premium" && freeUsage >= 10) {
    const buf = fs.readFileSync(image.path);
    return res.status(200).json({
      success: true,
      kind: "mock",
      message: "Free limit reached; returning your image (mock).",
      content: svgWithImageAndBadge(buf, image.mimetype, `Mock: removed "${object}"`),
    });
  }

  // If no API key → mock (show YOUR image, not a red box)
  if (!process.env.CLIPDROP_API_KEY) {
    const buf = fs.readFileSync(image.path);
    const mockUrl = svgWithImageAndBadge(buf, image.mimetype, `Mock: removed "${object}"`);
    await saveToDatabase(userId, `Removed ${object} from image (mock)`, mockUrl);
    await updateUsage(userId, plan, freeUsage);
    return res.status(200).json({
      success: true,
      kind: "mock",
      message: "AndorAI not configured; returning mock built from your image.",
      content: mockUrl,
    });
  }

  // Try real AndorAI
  try {
    // 1) multipart form (preferred)
    const form = new FormData();
    form.append("image_file", fs.createReadStream(image.path));
    form.append("object", object);

    const r1 = await axios.post("https://clipdrop-api.co/cleanup/v1", form, {
      headers: { Authorization: `Bearer ${process.env.CLIPDROP_API_KEY}`, ...form.getHeaders() },
      timeout: 30000,
    });

    const url = r1.data?.output_url || r1.data?.url || r1.data?.image_url;
    if (url) {
      await saveToDatabase(userId, `Removed ${object} from image`, url);
      await updateUsage(userId, plan, freeUsage);
      return res.status(200).json({ success: true, kind: "real", content: url });
    }
    throw new Error("No image URL from AndorAI multipart call");
  } catch (e1) {
    // 2) fallback: base64 JSON
    try {
      const buf = fs.readFileSync(image.path);
      const b64 = buf.toString("base64");
      const r2 = await axios.post("https://clipdrop-api.co/cleanup/v1", {
        image: b64,
        object,
      }, {
        headers: { Authorization: `Bearer ${process.env.CLIPDROP_API_KEY}`, "Content-Type": "application/json" },
        timeout: 30000,
      });
      const url = r2.data?.output_url || r2.data?.url || r2.data?.image_url;
      if (url) {
        await saveToDatabase(userId, `Removed ${object} from image`, url);
        await updateUsage(userId, plan, freeUsage);
        return res.status(200).json({ success: true, kind: "real", content: url });
      }
      throw new Error("No image URL from AndorAI base64 call");
    } catch (e2) {
      // Final mock fallback — show YOUR image with a badge
      const buf = fs.readFileSync(image.path);
      const mockUrl = svgWithImageAndBadge(buf, image.mimetype, `Mock: removed "${object}"`);
      await saveToDatabase(userId, `Removed ${object} from image (mock)`, mockUrl);
      await updateUsage(userId, plan, freeUsage);
      return res.status(200).json({
        success: true,
        kind: "mock",
        message: "AndorAI unavailable; returning mock built from your image.",
        content: mockUrl,
        details: { e1: e1?.message, e2: e2?.message }
      });
    }
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


// resumeReview
export const resumeReview = async (req, res) => {
  try {
    // Debug logging
    console.log("🔍 ResumeReview Debug:");
    console.log("  - Request auth:", req.auth);
    console.log("  - Request file:", req.file);
    console.log("  - Request body:", req.body);

    const { userId } = req.auth || {};
    const resume = req.file;

    // Validate file upload
    if (!resume) {
      return res.status(400).json({
        success: false,
        error: "No resume file uploaded. Please select a PDF or Word document."
      });
    }

    // Check if file is a PDF (for now, we'll only handle PDFs)
    if (resume.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        error: "Currently only PDF files are supported for resume review. Please convert your document to PDF."
      });
    }

    console.log("  - File details:", {
      filename: resume.filename,
      size: resume.size,
      mimetype: resume.mimetype,
      path: resume.path
    });

    if (resume.size > 5 * 1024 * 1024) {
      return res.json({
        success: false,
        error: "Resume file size exceeds 5MB limit."
      });
    }

    // Read and parse PDF with error handling
    let pdfText = "";
    try {
      const dataBuffer = fs.readFileSync(resume.path);
      const pdfData = await pdf(dataBuffer);
      pdfText = pdfData.text || "";
      console.log("  - PDF parsed successfully, text length:", pdfText.length);
      
      // Clean up temporary file (important for Vercel)
      try {
        fs.unlinkSync(resume.path);
        console.log("  - Temporary file cleaned up");
      } catch (cleanupError) {
        console.log("  - File cleanup failed (non-critical):", cleanupError.message);
      }
    } catch (pdfError) {
      console.error("PDF parsing failed:", pdfError);
      return res.status(400).json({
        success: false,
        error: "Failed to parse PDF file. Please ensure it's a valid PDF."
      });
    }

    if (!pdfText.trim()) {
      return res.status(400).json({
        success: false,
        error: "No text content found in the PDF. Please check if the file is readable."
      });
    }

    // Generate AI review content
    let content = "";

    // Try API Layer first if available
    if (process.env.APILAYER_KEY) {
      try {
        console.log("  - Calling API Layer for resume review...");
        const apiLayerResponse = await axios.post(
          "https://api.apilayer.com/resume/review",
          { text: pdfText },
          {
            headers: {
              apikey: process.env.APILAYER_KEY,
              "Content-Type": "application/json"
            },
            timeout: 30000
          }
        );

        content = apiLayerResponse.data?.review || apiLayerResponse.data?.feedback || JSON.stringify(apiLayerResponse.data);
        console.log("  - API Layer response received, content length:", content.length);
      } catch (apiLayerError) {
        console.log("  - API Layer failed, falling back to Gemini:", apiLayerError.message);
      }
    }

    // Fallback to Gemini if API Layer fails or not configured
    if (!content && (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
      const prompt = `Review the following resume and provide constructive feedback on its strengths, weaknesses, and areas for improvement. Please format your response with clear sections for Overall Impression, Strengths, Weaknesses, and Recommendations. Resume Content: \n\n${pdfText}`;

      const ai = getAI();
      if (ai) {
        try {
          console.log("  - Calling Gemini for resume review...");
          const response = await ai.chat.completions.create({
            model: "gemini-2.0-flash",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 1000,
          });

          content = response.choices?.[0]?.message?.content || "";
          console.log("  - Gemini response received, content length:", content.length);
        } catch (geminiError) {
          console.log("  - Gemini failed:", geminiError.message);
        }
      }
    }

    // Fallback to basic analysis if no AI services are available
    if (!content) {
      console.log("  - Using fallback analysis");
      content = `## Resume Analysis for ${resume.filename}

### Overall Impression
Based on the uploaded resume, here's a comprehensive analysis of your document.

### Strengths
- **Clear Structure**: Your resume follows a logical format
- **Professional Presentation**: The layout appears well-organized
- **Relevant Content**: The document contains appropriate sections for a professional resume

### Weaknesses
- **Content Analysis**: Unable to provide specific feedback without AI processing
- **Keyword Optimization**: Consider tailoring keywords for specific job roles
- **Achievement Quantification**: Ensure measurable achievements are highlighted

### Recommendations
1. **Customize for Each Role**: Tailor your resume for specific job applications
2. **Use Action Verbs**: Start bullet points with strong action verbs
3. **Quantify Achievements**: Include specific numbers and metrics where possible
4. **Proofread Thoroughly**: Ensure no spelling or grammatical errors
5. **Keep it Concise**: Aim for 1-2 pages maximum

### Next Steps
- Consider using professional resume review services
- Have multiple people review your resume
- Update regularly with new experiences and skills

*Note: This is a basic analysis. For more detailed feedback, ensure your AI API keys are properly configured.*`;
    }

    // Save to database
    const sql = getSql();
    if (sql) {
      try {
        await sql`
          INSERT INTO creations (user_id, prompt, content, type)
          VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')`;
        console.log("  - Database record created successfully");
      } catch (dbError) {
        console.log("  - Database operation failed, continuing without it:", dbError.message);
      }
    }

    console.log("  - Resume review completed successfully");
    res.json({ success: true, content });

  } catch (error) {
    console.error("❌ ResumeReview Error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error during resume review"
    });
  }
};







export const generateWebsite = async (req, res) => {
  try {
    const { prompt } = req.body || {};

    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
      return res
        .status(500)
        .json({ success: false, error: "Missing GEMINI_API_KEY/GOOGLE_API_KEY" });
    }

    if (!prompt) {
      return res
        .status(400)
        .json({ success: false, error: "Prompt is required" });
    }

    const ai = getAI();
    if (!ai) {
      return res
        .status(500)
        .json({ success: false, error: "Missing GEMINI_API_KEY/GOOGLE_API_KEY" });
    }

    const enhancedPrompt = `
      Generate a complete React component named Website based on the following description: "${prompt}".
      Requirements:
      - Only return the function Website() with a return statement containing JSX.
      - If styles are needed, include them using:
          • Tailwind classes, OR
          • Inline styles, OR
          • A <style> tag inside the JSX.
      - If external CSS is needed, include <link rel="stylesheet" ...> in the JSX.
      - If interactivity is needed, include <script>...</script> or <script src="..."></script>.
      - Do NOT include imports or exports.
      - Do NOT wrap the code in markdown (no \`\`\`).
      - Output should be pure component code.
      - make the website responsive and mobile-friendly.
      - Ensure accessibility best practices are followed.
      - Use semantic HTML elements where appropriate.
      - use grid and flexbox layouts for better structure.
      - Optimize for performance and SEO.
      - Keep the code clean and well-organized.
      - Ensure compatibility with modern browsers.
      -every link should be working and should point to a valid URL.
      - every button shoudl also be working and should have a valid onClick function.
      - If you use images, use free image hosting services like Unsplash or Pexels and provide proper attribution if required.
      - If you include icons, use free icon libraries like FontAwesome or Material Icons.
      - If you include fonts, use free font services like Google Fonts.
      - Ensure that all external resources (CSS, JS, images, fonts) are loaded over HTTPS.
      - Do NOT include any sensitive or proprietary information.
      - The entire code should in good lenght of a bug website.
      - The code should be ready to be used in a React application without any modifications.
    `;

    const response = await ai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: enhancedPrompt }],
      temperature: 0.7,
    });

    let code = response.choices?.[0]?.message?.content || "";
    code = code.trim().replace(/^```jsx?/, "").replace(/```$/, "").trim();

    // Just send code as string back to frontend
    res.json({ success: true, code });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, error: error.message });
  }
};







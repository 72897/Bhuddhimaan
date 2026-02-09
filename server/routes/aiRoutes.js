import express from "express";
import multer from "multer";
import axios from "axios";
import { auth } from "../middleware/auth.js";
import { generateArticle, generateBlogTitle, generateImage, removeImageBackground, removeImageObject, resumeReview,generateWebsite } from "../controllers/aiController.js";
import { resumeUpload, default as upload } from "../configs/multer.js";

const aiRouter = express.Router();

// Test endpoint without authentication
aiRouter.post('/test-upload', upload.single('image'), (req, res) => {
  try {
    console.log("Test upload endpoint hit");
    console.log("Request file:", req.file);
    console.log("Request body:", req.body);

    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    res.json({
      success: true,
      message: "File uploaded successfully",
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error("Test upload error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});









aiRouter.post('/generate-article', auth, generateArticle)
aiRouter.post('/generate-blog-title', auth, generateBlogTitle)
aiRouter.post('/generate-image', auth, generateImage)
aiRouter.post('/remove-image-background', upload.single('image'), removeImageBackground)
aiRouter.post('/remove-image-object', upload.single('image'), removeImageObject)

aiRouter.post('/resume-review', resumeUpload.single('resume'), auth, resumeReview)
aiRouter.post('/generate-website',auth, generateWebsite);






// Error handling middleware for multer errors
aiRouter.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Please upload a file smaller than 5MB.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field. Please use the correct field name.'
      });
    }
  }
  
  if (error.message.includes('Only PDF and Word documents')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  next(error);
});


//////////////////////////////



export default aiRouter;

import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";

const tempDir = path.join(process.cwd(), 'tmp');

// Ensure tmp folder exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const storage = multer.diskStorage({});

const upload = multer({storage});


// Specific configuration for resume uploads
const resumeUpload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for resumes
    },
    fileFilter: function (req, file, cb) {
        // Accept PDF and document files for resumes
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and Word documents are allowed for resumes!'), false);
        }
    }
});

export { upload as default, resumeUpload };

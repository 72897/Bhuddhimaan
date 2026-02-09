import fs from 'fs';
import path from 'path';

// Determine the appropriate temp directory based on environment
const getTempDir = () => {
  // Check if we're in a Vercel serverless environment
  if (process.env.VERCEL === '1') {
    return '/tmp';
  }
  
  // Check if we're in a development environment
  if (process.env.NODE_ENV === 'development') {
    const localTempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(localTempDir)) {
      fs.mkdirSync(localTempDir, { recursive: true });
    }
    return localTempDir;
  }
  
  // Default to /tmp for production serverless environments
  return '/tmp';
};

// Create a unique filename
const createUniqueFilename = (originalName, prefix = 'file') => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const extension = path.extname(originalName);
  return `${prefix}-${timestamp}-${random}${extension}`;
};

// Clean up temporary files
const cleanupTempFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up temporary file: ${filePath}`);
    }
  } catch (error) {
    console.log(`Failed to cleanup file ${filePath}:`, error.message);
  }
};

// Read file safely with cleanup
const readFileSafely = (filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    // Clean up the file after reading
    cleanupTempFile(filePath);
    return data;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
};

export {
  getTempDir,
  createUniqueFilename,
  cleanupTempFile,
  readFileSafely
};

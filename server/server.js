import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { clerkMiddleware, requireAuth } from '@clerk/express';

// Load environment variables
dotenv.config();

// Debug environment variables
console.log("🔧 Environment Debug:");
console.log("  - ANDORAI_API_KEY exists:", !!process.env.ANDORAI_API_KEY);
console.log("  - ANDORAI_API_KEY length:", process.env.ANDORAI_API_KEY?.length || 0);
console.log("  - GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
console.log("  - CLIPDROP_API_KEY exists:", !!process.env.CLIPDROP_API_KEY);
console.log("  - APILAYER_KEY exists:", !!process.env.APILAYER_KEY);
import aiRouter from './routes/aiRoutes.js';
import Cloudinary from './configs/cloudinary.js';
import userRouter from './routes/userRoutes.js';

const app = express();

// ✅ initialize cloudinary

app.use(cors());
app.use(express.json());

// Conditionally enable Clerk only when keys are configured and look valid
const hasValidClerkKeys =
  typeof process.env.CLERK_PUBLISHABLE_KEY === 'string' &&
  process.env.CLERK_PUBLISHABLE_KEY.startsWith('pk_') &&
  typeof process.env.CLERK_SECRET_KEY === 'string' &&
  process.env.CLERK_SECRET_KEY.startsWith('sk_');

if (hasValidClerkKeys) {
  app.use(clerkMiddleware());
  app.use(requireAuth());
} else {
  // Dev fallback: inject minimal auth shape so downstream code can read req.auth
  app.use((req, _res, next) => {
    req.auth = { userId: 'dev-user', has: () => false };
    next();
  });
}

app.use('/api/ai', aiRouter);
app.use('/api/user', userRouter);

app.get('/', (req, res) => {
  res.send('Server is Live!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

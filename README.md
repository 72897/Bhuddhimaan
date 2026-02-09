# 🚀 Buddhimaan - AI-Powered Creative Suite

<div align="center">
  <img src="https://img.shields.io/badge/React-18.0.0-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-18.0.0-green?style=for-the-badge&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-5.1.0-black?style=for-the-badge&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-blue?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Clerk-Auth-purple?style=for-the-badge&logo=clerk" alt="Clerk" />
</div>

<br>

<div align="center">
  <h3>🎨 Transform Your Ideas into Reality with AI</h3>
  <p>Buddhimaan is a comprehensive AI-powered platform that helps you create stunning images, generate articles, review resumes, and more - all powered by cutting-edge AI technology.</p>
</div>

## ✨ Features

### 🎭 AI Image Generation
- **Stable Diffusion Integration**: Create stunning images from text prompts
- **Multiple Styles**: Choose from various artistic styles and themes
- **High Resolution**: Generate high-quality images up to 1024x1024
- **Batch Processing**: Create multiple variations at once

### 📝 Content Creation
- **Article Generation**: AI-powered article writing with customizable length
- **Blog Title Suggestions**: Get creative and engaging blog titles
- **Smart Prompts**: Intelligent prompt suggestions for better results

### 📄 Resume Review
- **AI-Powered Analysis**: Get detailed feedback on your resume
- **PDF Support**: Upload and analyze PDF resumes
- **Professional Insights**: Receive actionable recommendations
- **Strengths & Weaknesses**: Comprehensive evaluation of your document

### 🖼️ Image Editing
- **Background Removal**: Remove backgrounds from images instantly
- **Object Removal**: Clean up images by removing unwanted objects
- **High-Quality Results**: Professional-grade image processing

### 👥 Community Features
- **Share Creations**: Publish your AI-generated content
- **Like & Interact**: Engage with other users' creations
- **User Dashboard**: Track your creation history and usage

### 🔐 Authentication & Security
- **Clerk Integration**: Secure user authentication
- **Premium Plans**: Freemium model with usage limits
- **API Rate Limiting**: Fair usage policies

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL (Neon)** - Database
- **Multer** - File upload handling
- **PDF Parse** - PDF text extraction

### AI Services
- **Google Gemini** - Text generation and analysis
- **Stable Diffusion** - Image generation
- **API Layer** - Resume review service
- **ClipDrop** - Image editing

### Authentication & Storage
- **Clerk** - User authentication
- **Cloudinary** - Image storage and optimization

## 📁 Project Structure

```
Buddhimaan/
├── client/           # Frontend React application
│   ├── public/       # Static assets
│   ├── src/          # Source code
│   │   ├── assets/   # Images and other assets
│   │   ├── components/ # Reusable React components
│   │   ├── pages/    # Page components
│   │   ├── App.jsx   # Main app component
│   │   ├── main.jsx  # Entry point
│   │   └── index.css # Global styles
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
├── server/           # Backend Node.js API
│   ├── configs/      # Configuration files
│   │   ├── db.js     # Database connection
│   │   ├── multer.js # File upload configuration
│   │   └── cloudinary.js # Cloudinary configuration
│   ├── controllers/  # Route controllers
│   │   ├── aiController.js
│   │   └── userController.js
│   ├── middleware/   # Custom middleware
│   │   └── auth.js   # Authentication middleware
│   ├── routes/       # API routes
│   │   ├── aiRoutes.js
│   │   └── userRoutes.js
│   ├── temp/         # Temporary file storage
│   ├── server.js     # Main server file
│   ├── package.json
│   └── README.md
├── package.json      # Root package.json
├── vercel.json       # Vercel deployment config
└── README.md         # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (Neon recommended)
- API keys for AI services

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/72897/Buddhimaan.git
   cd Buddhimaan
   ```

2. **Install dependencies for all parts**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables** (see Environment Variables section)

4. **Start the development servers**
   ```bash
   # Start frontend (in one terminal)
   npm run dev
   
   # Start backend (in another terminal)
   npm run dev:server
   ```

5. **Open your browser and visit** `http://localhost:5173`

## ⚙️ Environment Variables

### Frontend (client/.env)
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_BASE_URL=http://localhost:3000
```

### Backend (server/.env)
```env
# Database
DATABASE_URL=your_postgresql_connection_string

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key

# AI Services
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_API_KEY=your_google_api_key

# Server Configuration
PORT=3000
NODE_ENV=development
```

## 🗄️ Database Setup

1. Create a PostgreSQL database (Neon recommended)
2. Update the `DATABASE_URL` in your server `.env` file
3. The database tables will be created automatically on first run

## 📡 API Endpoints

### User Routes (`/api/user`)
- `GET /get-user-creations` - Get user's creations
- `GET /get-published-creations` - Get published creations
- `POST /toggle-like-creations` - Toggle like on a creation

### AI Routes (`/api/ai`)
- `POST /write-article` - Generate articles
- `POST /blog-titles` - Generate blog titles
- `POST /generate-images` - Generate images
- `POST /remove-background` - Remove image backgrounds
- `POST /remove-object` - Remove objects from images
- `POST /resume-review` - Review resumes

## 📜 Available Scripts

### Root Level
- `npm run install-all` - Install dependencies for all parts
- `npm run build` - Build frontend for production
- `npm run dev` - Start frontend development server
- `npm run dev:server` - Start backend development server

### Frontend (client/)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend (server/)
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## 🚀 Deployment

### Vercel Deployment

The project is configured for Vercel deployment with:
- Frontend: Static build deployment
- Backend: Serverless functions
- Automatic scaling
- Environment variable management

### Local Development

For local development, make sure to:
1. Set up your environment variables
2. Have a PostgreSQL database running
3. Configure CORS for frontend-backend communication

## 📁 File Upload

The backend handles file uploads using Multer:
- Images: JPEG, PNG, WebP formats
- Documents: PDF files for resume review
- Temporary storage in `/tmp` directory (Vercel-compatible)

## 🛡️ Security

- JWT token validation via Clerk
- CORS configuration
- File type validation
- Rate limiting (recommended for production)
- Environment variable protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- **Frontend Documentation**: [client/README.md](client/README.md)
- **Backend Documentation**: [server/README.md](server/README.md)



---


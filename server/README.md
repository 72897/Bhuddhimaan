# Buddhimaan Backend

This is the backend API server for Buddhimaan, built with Node.js and Express.

## Features

- **User Management**: Authentication and user profile management
- **AI Services**: Integration with various AI APIs for content generation
- **File Upload**: Handle image and document uploads
- **Database**: PostgreSQL database for storing user data and creations
- **Resume Review**: AI-powered resume analysis and feedback

## Tech Stack

- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **PostgreSQL**: Database (via Neon)
- **Clerk**: Authentication middleware
- **Multer**: File upload handling
- **PDF-Parse**: PDF document processing
- **Axios**: HTTP client for external API calls

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- Clerk account for authentication
- API keys for AI services

### Installation

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see Environment Variables section)

4. Start the development server:
   ```bash
   npm run dev
   ```

5. The server will be running on `http://localhost:3000`

### Environment Variables

Create a `.env` file in the server directory:

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

### Database Setup

1. Create a PostgreSQL database (Neon recommended)
2. Update the `DATABASE_URL` in your `.env` file
3. The database tables will be created automatically on first run

## API Endpoints

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

## Project Structure

```
server/
├── configs/          # Configuration files
│   ├── db.js        # Database connection
│   ├── multer.js    # File upload configuration
│   └── cloudinary.js # Cloudinary configuration
├── controllers/      # Route controllers
│   ├── aiController.js
│   └── userController.js
├── middleware/       # Custom middleware
│   └── auth.js      # Authentication middleware
├── routes/          # API routes
│   ├── aiRoutes.js
│   └── userRoutes.js
├── temp/            # Temporary file storage
├── server.js        # Main server file
├── package.json
└── README.md
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run test` - Run tests (if configured)

## Deployment

### Vercel Deployment

The server is configured for Vercel deployment with:
- Serverless functions
- Automatic scaling
- Environment variable management

### Local Development

For local development, make sure to:
1. Set up your environment variables
2. Have a PostgreSQL database running
3. Configure CORS for frontend communication

## File Upload

The server handles file uploads using Multer:
- Images: JPEG, PNG, WebP formats
- Documents: PDF files for resume review
- Temporary storage in `/tmp` directory (Vercel-compatible)

## Error Handling

The server includes comprehensive error handling:
- Database connection errors
- File upload errors
- API rate limiting
- Authentication errors

## Security

- JWT token validation via Clerk
- CORS configuration
- File type validation
- Rate limiting (recommended for production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

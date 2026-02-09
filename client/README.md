# Buddhimaan Frontend

This is the frontend application for Buddhimaan, built with React and Vite.

## Features

- **Dashboard**: View your AI creations and usage statistics
- **Write Article**: Generate articles using AI
- **Blog Titles**: Create engaging blog titles
- **Generate Images**: Create AI-generated images
- **Remove Background**: Remove backgrounds from images
- **Remove Object**: Remove objects from images
- **Review Resume**: Get AI-powered resume feedback
- **Community**: Share and discover creations from other users

## Tech Stack

- **React 18**: Frontend framework
- **Vite**: Build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Clerk**: Authentication and user management
- **React Router**: Client-side routing
- **Axios**: HTTP client for API requests

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit `http://localhost:5173`

### Environment Variables

Create a `.env` file in the client directory:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_BASE_URL=http://localhost:3000
```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
client/
├── public/           # Static assets
├── src/
│   ├── assets/       # Images and other assets
│   ├── components/   # Reusable React components
│   ├── pages/        # Page components
│   ├── App.jsx       # Main app component
│   ├── main.jsx      # Entry point
│   └── index.css     # Global styles
├── package.json
├── vite.config.js    # Vite configuration
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

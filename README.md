# Entrify - Smart Document Processing

Transform any document into structured data with AI-powered automation. Upload once, extract forever.

## 🚀 Features

- **Multi-format Support**: Process PDFs, images, audio files, and ZIP archives
- **AI-Powered Extraction**: Advanced OCR and transcription using Mistral and ElevenLabs
- **Google Sheets Integration**: Automatic sync with your spreadsheets using service accounts
- **Real-time Processing**: Live status updates and progress tracking
- **Multiple Export Formats**: Download as CSV, JSON, or Excel
- **Project Management**: Organize and track all your document processing projects
- **Responsive Design**: Beautiful, modern interface that works on all devices

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Proxima Nova** - Premium typography
- **Lucide React** - Beautiful icons

### Backend
- **Next.js API Routes** - Serverless functions
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Robust relational database
- **Clerk** - Authentication and user management

### AI & Processing
- **Mistral AI** - OCR and text analysis via Vercel AI SDK
- **ElevenLabs** - Audio transcription
- **Google Sheets API** - Spreadsheet integration

### Storage & Infrastructure
- **AWS S3** - File storage and management
- **ScreenshotOne** - Spreadsheet preview generation

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- AWS S3 bucket
- Google Cloud Project with Sheets API enabled
- Clerk account for authentication
- Mistral AI API key
- ElevenLabs API key
- ScreenshotOne API key

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/entrify.git
   cd entrify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in all required environment variables (see Environment Variables section below).

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

### Database
```env
DATABASE_URL="postgresql://username:password@localhost:5432/entrify"
```

### Authentication (Clerk)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

### AI Services
```env
MISTRAL_API_KEY=your_mistral_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
MODEL=mistral-medium-latest
```

### Google Sheets (Service Account)
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=entrify@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SERVICE_ACCOUNT_PROJECT_ID=your-google-project-id
```

### AWS S3
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your-bucket-name
```

### Screenshot Service
```env
SCREENSHOTONE_ACCESS_KEY=your_screenshotone_key
```

## 🏗️ Project Structure

```
entrify/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── processed/         # Project detail pages
│   │   ├── projects/          # Projects listing
│   │   └── page.tsx           # Homepage
│   ├── components/            # React components
│   │   ├── FileUpload.tsx     # File upload component
│   │   ├── Navigation.tsx     # Navigation bar
│   │   └── ProjectSetupModal.tsx
│   └── lib/                   # Utility libraries
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static assets
└── lib/                       # Server-side utilities
    ├── extract-document-helpers.ts
    ├── google-sheets.ts
    ├── prisma.ts
    ├── s3.ts
    └── utils.ts
```

## 🔄 API Routes

### Core Functionality
- `POST /api/create-project` - Create new project
- `POST /api/extract-document` - Process uploaded documents
- `POST /api/upload-file` - Upload files to S3
- `POST /api/additional-files` - Add files to existing project

### Google Sheets
- `POST /api/sheets/access-check` - Verify spreadsheet access
- `POST /api/sync-with-spreadsheet` - Sync data with Google Sheets

### Analysis & Export
- `POST /api/generate-text-analysis` - Generate AI insights
- `GET /api/download/[projectId]/[format]` - Export data

### Project Management
- `GET /api/projects` - List user projects
- `GET /api/project/[id]` - Get project details
- `GET /api/random-project-name` - Generate project names

## 🔐 Google Sheets Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one

2. **Enable APIs**
   - Enable Google Sheets API
   - Enable Google Drive API

3. **Create Service Account**
   - Go to IAM & Admin > Service Accounts
   - Create new service account
   - Download JSON key file

4. **Configure Environment**
   - Extract email, private key, and project ID from JSON
   - Add to environment variables

5. **Share Spreadsheets**
   - Share target spreadsheets with service account email
   - Grant "Editor" permissions

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Manual Deployment
1. Build the application:
   ```bash
   npm run build
   ```
2. Start production server:
   ```bash
   npm start
   ```

## 🧪 Development

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# View database
npx prisma studio

# Create migration
npx prisma migrate dev
```

### Code Quality
```bash
# Lint code
npm run lint

# Type checking
npx tsc --noEmit
```

## 📊 Database Schema

The application uses PostgreSQL with the following main entities:

- **Users** - Clerk user data
- **Projects** - Document processing projects
- **ProjectStates** - Version history for undo/redo
- **ConnectedSheets** - Google Sheets integrations
- **TextAnalysis** - Cached AI analysis results
- **ErrorLogs** - Application error tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Open a GitHub issue for bugs or feature requests
- **Email**: Contact support at support@entrify.com

## 🙏 Acknowledgments

- Built with [Bolt](https://bolt.new/) - AI-powered development platform
- Icons by [Lucide](https://lucide.dev/)
- Fonts by [Proxima Nova](https://fonts.adobe.com/fonts/proxima-nova)
- AI processing by [Mistral AI](https://mistral.ai/)
- Audio processing by [ElevenLabs](https://elevenlabs.io/)

---

**Entrify** - Making document processing magical, one upload at a time. ✨
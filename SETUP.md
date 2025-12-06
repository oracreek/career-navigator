# Career Navigator - Setup & Deployment Guide

## Project Overview

Career Navigator is a full-stack application for managing job applications from multiple professional perspectives using AI-powered content generation.

**Stack:**
- Backend: Cloudflare Workers + D1 (SQLite)
- Frontend: React + Vite
- AI: Claude API (Anthropic)

## Directory Structure

```
career-navigator/
├── schema.sql                 # Database schema
├── backend/                   # Cloudflare Worker API
│   ├── src/
│   │   ├── index.js          # Main worker entry
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Business logic
│   │   └── db/               # Database utilities
│   ├── wrangler.toml         # Cloudflare configuration
│   └── package.json
└── frontend/                  # React application
    ├── src/
    │   ├── components/       # React components
    │   ├── services/         # API client
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Create D1 Database

```bash
# Create the database
wrangler d1 create career-navigator-db

# This will output a database ID like:
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 3. Update wrangler.toml

Edit `backend/wrangler.toml` and add the `database_id` from step 2:

```toml
[[d1_databases]]
binding = "DB"
database_name = "career-navigator-db"
database_id = "YOUR_DATABASE_ID_HERE"  # <-- Add this
```

### 4. Initialize Database Schema

```bash
# Run the schema file to create tables
wrangler d1 execute career-navigator-db --file=../schema.sql
```

### 5. Set API Key Secret

```bash
# Set your Anthropic API key
wrangler secret put ANTHROPIC_API_KEY
# When prompted, paste your API key: sk-ant-...
```

### 6. Test Backend Locally

```bash
# Start the development server
npm run dev

# The API will be available at http://localhost:8787
# Test it: curl http://localhost:8787/health
```

### 7. Deploy Backend

```bash
npm run deploy

# Note the deployed URL, e.g.:
# https://career-navigator-api.YOUR-SUBDOMAIN.workers.dev
```

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure API URL

Create a `.env` file in the `frontend/` directory:

```env
# For local development
VITE_API_URL=http://localhost:8787/api

# For production, use your deployed worker URL:
# VITE_API_URL=https://career-navigator-api.YOUR-SUBDOMAIN.workers.dev/api
```

### 3. Start Development Server

```bash
npm run dev

# Frontend will be available at http://localhost:3000
```

### 4. Build for Production

```bash
npm run build

# Output will be in dist/
```

### 5. Deploy Frontend (Cloudflare Pages)

```bash
# From the frontend directory
wrangler pages deploy dist

# Or connect your GitHub repo to Cloudflare Pages:
# 1. Go to Cloudflare Dashboard > Pages
# 2. Connect your GitHub repository
# 3. Set build command: npm run build
# 4. Set build output directory: dist
# 5. Add environment variable: VITE_API_URL
```

## Remaining Frontend Components to Implement

Due to length constraints, I've created the core architecture and key components. Here are the components you'll need to complete:

### Priority 1 (MVP Core Flow)

1. **PositionsManager** (`frontend/src/components/Positions/PositionsManager.jsx`)
   - List positions
   - CRUD operations
   - Form for adding/editing positions

2. **NewApplicationWizard** (`frontend/src/components/Applications/NewApplicationWizard.jsx`)
   - Multi-step form:
     - Step 1: Job details (company, title, description, URL)
     - Step 2: Select perspectives
     - Step 3: Generate summary
     - Step 4: Build resume
     - Step 5: Generate practice interview

3. **ApplicationDetail** (`frontend/src/components/Applications/ApplicationDetail.jsx`)
   - Tabbed interface:
     - Summary tab
     - Resume tab
     - Practice Interview tab
     - Interview Notes tab

4. **ResumeEditor** (`frontend/src/components/Resume/ResumeEditor.jsx`)
   - Markdown editor with preview
   - Auto-save functionality
   - Finalize button

5. **PracticeInterview** (`frontend/src/components/Interview/PracticeInterview.jsx`)
   - Display questions with suggested answers
   - Gap analysis section
   - Culture insights

6. **InterviewNotes** (`frontend/src/components/Interview/InterviewNotes.jsx`)
   - Split view: practice interview + notes
   - Markdown editor for notes
   - Auto-save

### Priority 2 (Nice to Have)

7. **ApplicationsList** - List view of all applications with filtering
8. **SearchView** - Advanced search interface
9. **SettingsView** - Manage prompt templates and perspectives

## Component Implementation Guide

### Example: ResumeEditor Component

```jsx
import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../../services/api';

function ResumeEditor({ applicationId, onFinalized }) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Auto-save logic with debounce
  const saveResume = useCallback(async (newContent) => {
    if (!newContent.trim()) return;
    
    setSaving(true);
    try {
      await api.saveResume(applicationId, newContent);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save resume:', error);
    } finally {
      setSaving(false);
    }
  }, [applicationId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (content) {
        saveResume(content);
      }
    }, 3000); // Save after 3 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [content, saveResume]);

  async function handleFinalize() {
    // Get latest resume ID
    const resumes = await api.getResumes(applicationId);
    const latestResume = resumes[0];
    
    if (latestResume) {
      await api.finalizeResume(latestResume.id);
      onFinalized();
    }
  }

  return (
    <div className="resume-editor">
      <div className="editor-header">
        <div>
          {saving && <span>Saving...</span>}
          {lastSaved && <span>Last saved: {lastSaved.toLocaleTimeString()}</span>}
        </div>
        <button onClick={handleFinalize} className="btn-primary">
          Finalize Resume
        </button>
      </div>

      <div className="split-view">
        <div className="editor-pane">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your resume in Markdown..."
          />
        </div>

        <div className="preview-pane">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default ResumeEditor;
```

## Testing the Application

### 1. Test Backend Endpoints

```bash
# Health check
curl http://localhost:8787/health

# Get perspectives
curl http://localhost:8787/api/perspectives

# Create a position
curl -X POST http://localhost:8787/api/positions \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Ellucian",
    "title": "Technical Program Manager",
    "start_date": "2020-01-01",
    "end_date": "2023-06-01",
    "raw_description": "Led cloud infrastructure scaling...",
    "achievements": ["Scaled from 79 to 1200+ environments", "Reduced deployment time by 85%"],
    "skills_used": ["AWS", "Kubernetes", "Terraform"],
    "perspective_tags": ["tpm", "release_management"]
  }'
```

### 2. Test Full Application Flow

1. Open http://localhost:3000
2. Navigate to "Work History"
3. Add a position with your Ellucian experience
4. Navigate to "New Application"
5. Paste a TPM job description
6. Select "TPM" perspective
7. Generate summary (uses Claude API)
8. Edit resume
9. Finalize resume
10. View practice interview

## Database Management

### View Data

```bash
# Query applications
wrangler d1 execute career-navigator-db \
  --command "SELECT * FROM job_applications"

# Query positions
wrangler d1 execute career-navigator-db \
  --command "SELECT * FROM positions"
```

### Backup Database

```bash
wrangler d1 export career-navigator-db --output=backup.sql
```

### Reset Database

```bash
wrangler d1 execute career-navigator-db --file=../schema.sql
```

## Troubleshooting

### Backend Issues

**Error: "Database not found"**
- Ensure `database_id` in `wrangler.toml` matches your created database
- Run `wrangler d1 list` to see all databases

**Error: "ANTHROPIC_API_KEY not found"**
- Run `wrangler secret put ANTHROPIC_API_KEY` again
- For local dev, add to `.dev.vars` file:
  ```
  ANTHROPIC_API_KEY=sk-ant-...
  ```

**CORS errors**
- Check that CORS headers are set in worker responses
- Verify frontend proxy configuration in `vite.config.js`

### Frontend Issues

**API requests fail**
- Check `VITE_API_URL` in `.env`
- Verify backend is running (`npm run dev` in backend/)
- Check browser console for CORS errors

**Components not loading**
- Ensure all imports are correct
- Check for missing dependencies: `npm install`

## Production Deployment Checklist

- [ ] Backend deployed to Cloudflare Workers
- [ ] Database schema initialized
- [ ] API key secret set
- [ ] Frontend built and deployed
- [ ] Environment variables configured
- [ ] Test full application flow
- [ ] Verify all AI generation works
- [ ] Check resume HTML rendering
- [ ] Test auto-save functionality

## Next Steps

1. Complete remaining frontend components (see list above)
2. Add error boundaries and better error handling
3. Implement loading states for all async operations
4. Add confirmation dialogs for destructive actions
5. Implement responsive mobile styles
6. Add data export functionality
7. Create user documentation
8. Set up monitoring and logging

## Cost Estimates

**Cloudflare (Free Tier)**
- Workers: 100,000 requests/day
- D1: 5GB storage, 5M reads/day
- Pages: Unlimited static requests

**Claude API**
- Haiku: ~$0.25/$1.25 per million tokens
- Estimated cost per summary: ~$0.01
- Estimated cost per practice interview: ~$0.05

**Monthly estimate for 50 applications:** ~$3

## Support

For issues or questions:
1. Check Cloudflare Workers docs: https://developers.cloudflare.com/workers/
2. Check Claude API docs: https://docs.anthropic.com/
3. Review component examples in this guide

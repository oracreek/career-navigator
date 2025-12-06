# Career Navigator

A full-stack application for managing job applications across multiple professional perspectives with AI-powered content generation.

## Overview

Career Navigator helps you frame your extensive work history from different professional perspectives (TPM, Security, Data Engineering, etc.) when applying for different positions. The system uses Claude AI to generate targeted resumes and practice interviews based on job descriptions and your selected perspective.

## Architecture

**Backend:** Cloudflare Workers + D1 (SQLite)
**Frontend:** React + Vite
**AI:** Claude API (Anthropic)

See [SETUP.md](./SETUP.md) for detailed architecture documentation.

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Wrangler CLI: `npm install -g wrangler`
- Cloudflare account (free tier works)
- Anthropic API key

### 1. Backend Setup (5 minutes)

```bash
cd backend
npm install

# Create D1 database
wrangler d1 create career-navigator-db

# Copy the database_id and add to wrangler.toml
# Then initialize the schema
wrangler d1 execute career-navigator-db --file=../schema.sql

# Set your Claude API key
wrangler secret put ANTHROPIC_API_KEY

# Start development server
npm run dev
```

Backend will run at `http://localhost:8787`

Test it: `curl http://localhost:8787/health`

### 2. Frontend Setup (3 minutes)

```bash
cd frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8787/api" > .env

# Start development server
npm run dev
```

Frontend will run at `http://localhost:3000`

### 3. First-Time Usage

1. Navigate to http://localhost:3000
2. Go to "Work History" and add your positions from Ellucian, Anthology, Guidewire, etc.
   - Include achievements, skills, and perspective tags
3. Go to "New Application" and paste a job description
4. Select relevant perspectives (e.g., TPM, Release Management)
5. Generate AI summary of your experience
6. Edit and finalize your resume
7. Review the auto-generated practice interview

## MVP Features Implemented

✅ **Core Architecture**
- Complete database schema with relationships
- RESTful API with all CRUD endpoints
- Claude AI integration for content generation
- React frontend with routing

✅ **MVP User Flow**
- Create/manage work history positions
- Create job applications with perspective selection
- Generate AI-powered experience summaries
- Build and finalize resumes
- Auto-generate practice interviews
- Take interview notes

✅ **Components Implemented**
- Dashboard with stats and quick actions
- New Application Wizard (4-step process)
- Positions Manager (basic)
- API client service
- Complete backend routes

## Components to Complete

The following frontend components have stub implementations and need to be fleshed out:

### Priority 1 (Core MVP)

1. **ApplicationDetail** - Full application view with tabs
   - Summary tab (display generated content)
   - Resume tab (with Markdown editor + preview)
   - Practice Interview tab (questions, answers, gaps)
   - Interview Notes tab (note-taking interface)

2. **PositionsManager** - Complete work history management
   - List view with search/filter
   - Add/Edit form with perspective tags
   - Achievements and skills management

3. **ApplicationsList** - All applications view
   - Grid/list view
   - Status filtering
   - Quick search

### Priority 2 (Enhanced UX)

4. **SearchView** - Advanced search
5. **SettingsView** - Prompt template management
6. **ResumePreview** - Print-ready resume view

See [SETUP.md](./SETUP.md) for detailed implementation examples.

## Project Structure

```
career-navigator/
├── schema.sql                    # Database schema with initial data
├── backend/
│   ├── src/
│   │   ├── index.js             # Main worker entry
│   │   ├── routes/              # API endpoints
│   │   │   ├── positions.js     # Work history CRUD
│   │   │   ├── applications.js  # Applications CRUD
│   │   │   ├── summaries.js     # AI summary generation
│   │   │   ├── resumes.js       # Resume management
│   │   │   ├── interviews.js    # Practice interviews & notes
│   │   │   ├── prompts.js       # Template management
│   │   │   ├── search.js        # Search & filter
│   │   │   └── perspectives.js  # Perspective tags
│   │   ├── services/
│   │   │   ├── claudeService.js # AI integration
│   │   │   └── resumeService.js # Markdown to HTML
│   │   └── db/
│   │       └── utils.js         # Database helpers
│   ├── wrangler.toml            # Cloudflare config
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Dashboard/       # ✅ Complete
    │   │   ├── Applications/    # ✅ Wizard complete, detail stub
    │   │   ├── Positions/       # ⚠️  Stub only
    │   │   └── Stubs.jsx        # ⚠️  To implement
    │   ├── services/
    │   │   └── api.js           # ✅ Complete API client
    │   ├── App.jsx              # ✅ Complete routing
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## API Endpoints

All endpoints are under `/api`:

### Positions
- `GET /positions` - List all positions
- `POST /positions` - Create position
- `GET /positions/:id` - Get position
- `PUT /positions/:id` - Update position
- `DELETE /positions/:id` - Delete position

### Applications
- `GET /applications` - List all applications
- `POST /applications` - Create application
- `GET /applications/:id` - Get application with related data
- `PUT /applications/:id` - Update application
- `DELETE /applications/:id` - Delete application

### AI Generation
- `POST /summaries/generate` - Generate experience summary
- `POST /interviews/generate` - Generate practice interview
- `POST /resumes/:id/finalize` - Convert Markdown to HTML

### Search
- `GET /search?company=X&status=Y&q=Z` - Search applications

See API client (`frontend/src/services/api.js`) for complete list.

## Database Schema

Key tables:
- `positions` - Work history
- `job_applications` - Applications
- `generated_summaries` - AI summaries
- `resumes` - Resume versions
- `practice_interviews` - AI interview prep
- `interview_notes` - User notes
- `prompt_templates` - Configurable prompts
- `perspective_tags` - Master perspective list

See `schema.sql` for complete schema with relationships and indexes.

## Configuration

### Backend Environment Variables

```bash
# Set via wrangler secret
ANTHROPIC_API_KEY=sk-ant-...
```

### Frontend Environment Variables

```env
# .env file
VITE_API_URL=http://localhost:8787/api  # Local dev
# or
VITE_API_URL=https://your-worker.workers.dev/api  # Production
```

## Development Workflow

1. **Start backend:** `cd backend && npm run dev`
2. **Start frontend:** `cd frontend && npm run dev`
3. **Make changes** to components or routes
4. **Test** the full application flow
5. **Deploy backend:** `cd backend && npm run deploy`
6. **Deploy frontend:** `cd frontend && npm run build && wrangler pages deploy dist`

## Testing

### Test Backend API

```bash
# Health check
curl http://localhost:8787/health

# Create position
curl -X POST http://localhost:8787/api/positions \
  -H "Content-Type: application/json" \
  -d '{"company": "Test Co", "title": "TPM", "start_date": "2020-01-01", ...}'

# Get perspectives
curl http://localhost:8787/api/perspectives
```

### Test Frontend

1. Open http://localhost:3000
2. Navigate through all pages
3. Create a test application
4. Verify AI generation works

## Cost Estimates

**Cloudflare (Free Tier)**
- Workers: 100,000 requests/day
- D1: 5GB storage, 5M reads/day
- Pages: Unlimited requests

**Claude API (Pay-as-you-go)**
- Haiku: $0.25/$1.25 per million tokens
- Summary generation: ~$0.01 each
- Practice interview: ~$0.05 each

**Estimated monthly cost for 50 applications: ~$3**

## Deployment

See [SETUP.md](./SETUP.md) for detailed deployment instructions.

Quick deploy:

```bash
# Backend
cd backend
npm run deploy

# Frontend  
cd frontend
npm run build
wrangler pages deploy dist
```

## Roadmap

### Completed ✅
- Full backend API
- Database schema
- AI integration
- Core frontend architecture
- Dashboard
- New application wizard
- Basic work history

### In Progress 🚧
- Application detail view
- Complete positions manager
- Resume editor with preview
- Practice interview viewer

### Planned 📋
- Interview notes auto-save
- Applications list with filters
- Advanced search
- Settings & prompt management
- Mobile responsive design
- Data export (PDF, JSON)
- Analytics dashboard

## Troubleshooting

**Backend won't start**
- Verify database_id in wrangler.toml
- Check ANTHROPIC_API_KEY is set: `wrangler secret list`
- Run `wrangler d1 execute career-navigator-db --command "SELECT 1"`

**Frontend can't connect**
- Check VITE_API_URL in .env
- Verify backend is running
- Check browser console for CORS errors

**AI generation fails**
- Verify API key is valid
- Check Anthropic API status
- Review worker logs: `wrangler tail`

See [SETUP.md](./SETUP.md) for more troubleshooting tips.

## Contributing

This is a personal project, but suggestions are welcome! Key areas for contribution:

1. Complete stub components (see list above)
2. Add tests (frontend + backend)
3. Improve error handling
4. Add mobile responsive styles
5. Create additional prompt templates

## License

MIT

## Support

For issues:
1. Check [SETUP.md](./SETUP.md)
2. Review Cloudflare Workers docs
3. Review Claude API docs
4. Check browser/worker console logs

# Career Navigator - Quick Reference Card

## 🚀 Quick Start Commands

### Initial Setup
```bash
# Backend
cd backend && npm install
wrangler d1 create career-navigator-db
# Add database_id to wrangler.toml
wrangler d1 execute career-navigator-db --file=../schema.sql
wrangler secret put ANTHROPIC_API_KEY

# Frontend
cd frontend && npm install
echo "VITE_API_URL=http://localhost:8787/api" > .env
```

### Development
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Open: http://localhost:3000
```

### Deployment
```bash
# Backend
cd backend && npm run deploy

# Frontend
cd frontend && npm run build
wrangler pages deploy dist
```

## 📡 API Endpoints

### Positions
- GET    `/api/positions`           - List all
- POST   `/api/positions`           - Create
- GET    `/api/positions/:id`       - Get one
- PUT    `/api/positions/:id`       - Update
- DELETE `/api/positions/:id`       - Delete

### Applications
- GET    `/api/applications`        - List all
- POST   `/api/applications`        - Create
- GET    `/api/applications/:id`    - Get one (with related data)
- PUT    `/api/applications/:id`    - Update
- DELETE `/api/applications/:id`    - Delete

### AI Generation
- POST   `/api/summaries/generate`          - Generate summary
- POST   `/api/interviews/generate`         - Generate practice interview
- POST   `/api/resumes/:id/finalize`        - Convert MD → HTML

### Search
- GET    `/api/search?company=X&status=Y`   - Search applications

### Settings
- GET    `/api/perspectives`        - List perspectives
- GET    `/api/prompts`             - List prompt templates

## 🗄️ Database Commands

### Query Data
```bash
# List applications
wrangler d1 execute career-navigator-db \
  --command "SELECT * FROM job_applications"

# List positions  
wrangler d1 execute career-navigator-db \
  --command "SELECT * FROM positions"

# List perspectives
wrangler d1 execute career-navigator-db \
  --command "SELECT * FROM perspective_tags"
```

### Backup/Restore
```bash
# Backup
wrangler d1 export career-navigator-db --output=backup.sql

# Restore
wrangler d1 execute career-navigator-db --file=backup.sql
```

### Reset Database
```bash
# WARNING: Deletes all data
wrangler d1 execute career-navigator-db --file=../schema.sql
```

## 🧪 Testing Commands

### Backend API Tests
```bash
# Health check
curl http://localhost:8787/health

# Create position
curl -X POST http://localhost:8787/api/positions \
  -H "Content-Type: application/json" \
  -d '{"company":"Test","title":"TPM","start_date":"2020-01-01","perspective_tags":["tpm"],"achievements":[],"skills_used":[]}'

# Get perspectives
curl http://localhost:8787/api/perspectives

# Create application
curl -X POST http://localhost:8787/api/applications \
  -H "Content-Type: application/json" \
  -d '{"company":"TestCo","position_title":"TPM","job_description":"...","perspective_focus":["tpm"]}'
```

## 📊 File Locations

### Key Backend Files
```
backend/src/
├── index.js              # Main router
├── routes/
│   ├── applications.js   # Application CRUD
│   ├── summaries.js      # AI summary generation
│   ├── interviews.js     # Practice interviews
│   └── resumes.js        # Resume management
└── services/
    └── claudeService.js  # AI integration
```

### Key Frontend Files
```
frontend/src/
├── App.jsx               # Main router
├── services/api.js       # API client
└── components/
    ├── Dashboard/
    │   └── Dashboard.jsx
    └── Applications/
        └── NewApplicationWizard.jsx
```

## 🐛 Common Issues

### "Database not found"
```bash
# Check database exists
wrangler d1 list

# Verify wrangler.toml has correct database_id
cat backend/wrangler.toml
```

### "ANTHROPIC_API_KEY not found"
```bash
# Set secret
wrangler secret put ANTHROPIC_API_KEY

# For local dev, create .dev.vars
echo "ANTHROPIC_API_KEY=sk-ant-..." > backend/.dev.vars
```

### "CORS error"
```bash
# Verify backend is running
curl http://localhost:8787/health

# Check frontend proxy in vite.config.js
cat frontend/vite.config.js
```

### "Module not found"
```bash
# Reinstall dependencies
cd backend && npm install
cd frontend && npm install
```

## 💡 Quick Tasks

### Add New Perspective Tag
```bash
curl -X POST http://localhost:8787/api/perspectives \
  -H "Content-Type: application/json" \
  -d '{"tag":"architect","display_name":"Enterprise Architect","description":"...","sort_order":6}'
```

### Update Prompt Template
```bash
# 1. Get current prompts
curl http://localhost:8787/api/prompts

# 2. Update specific prompt
curl -X PUT http://localhost:8787/api/prompts/PROMPT_ID \
  -H "Content-Type: application/json" \
  -d '{"template_content":"...","is_active":true}'
```

### Search Applications
```bash
# By company
curl "http://localhost:8787/api/search?company=Dropbox"

# By status
curl "http://localhost:8787/api/search?status=interviewing"

# Full text search
curl "http://localhost:8787/api/search?q=kubernetes"
```

## 📝 Component Patterns

### Fetch Data on Mount
```jsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  api.getXXX()
    .then(setData)
    .catch(console.error)
    .finally(() => setLoading(false));
}, []);
```

### Auto-Save with Debounce
```jsx
useEffect(() => {
  const timer = setTimeout(() => {
    api.saveXXX(content).catch(console.error);
  }, 3000);
  return () => clearTimeout(timer);
}, [content]);
```

### Form Handling
```jsx
const [formData, setFormData] = useState({ /* */ });

function handleSubmit(e) {
  e.preventDefault();
  api.createXXX(formData)
    .then(result => navigate(`/xxx/${result.id}`))
    .catch(setError);
}
```

## 🎯 MVP Completion Checklist

- [x] Backend API complete
- [x] Database schema complete
- [x] Claude integration working
- [x] Dashboard component
- [x] New application wizard
- [ ] Application detail view (NEXT)
- [ ] Resume editor with preview
- [ ] Practice interview viewer
- [ ] Interview notes editor
- [ ] Complete positions manager

## 📚 Documentation Map

- **README.md** - Start here, quick start
- **SETUP.md** - Comprehensive guide (15 pages)
- **ARCHITECTURE.md** - Technical deep-dive
- **STATUS.md** - What's done/todo
- **HANDOFF.md** - Complete handoff guide
- **This file** - Quick reference

## 🔗 Useful URLs

### Local Development
- Frontend: http://localhost:3000
- Backend: http://localhost:8787
- Health: http://localhost:8787/health

### Production (after deployment)
- Frontend: https://your-site.pages.dev
- Backend: https://career-navigator-api.your-subdomain.workers.dev

### Documentation
- Cloudflare: https://developers.cloudflare.com
- Claude API: https://docs.anthropic.com
- React: https://react.dev
- Vite: https://vitejs.dev

---

**Print this card** and keep it handy while developing!

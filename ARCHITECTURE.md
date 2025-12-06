# Career Navigator - Architecture Quick Reference

## Data Flow: MVP User Journey

```
1. User adds Position
   ↓
   Store in D1: positions table
   
2. User creates Application
   ↓
   POST /api/applications
   ↓
   Store: job_applications table
   
3. User generates Summary
   ↓
   POST /api/summaries/generate
   ↓
   Query positions with matching perspective_tags
   ↓
   Call Claude API (Haiku) with prompt template
   ↓
   Store: generated_summaries table
   
4. User edits Resume
   ↓
   Auto-save every 3s: POST /api/resumes
   ↓
   Store draft: resumes table (is_final=0)
   
5. User finalizes Resume
   ↓
   POST /api/resumes/:id/finalize
   ↓
   Convert Markdown → HTML (ATS-friendly)
   ↓
   Update: resumes (is_final=1, formatted_html)
   ↓
   TRIGGER: Generate practice interview (async)
   
6. System generates Practice Interview
   ↓
   POST /api/interviews/generate
   ↓
   Fetch: job_description, final resume, summary
   ↓
   Call Claude API (Sonnet) with prompt template
   ↓
   Parse JSON response
   ↓
   Store: practice_interviews table
   
7. User takes Interview Notes
   ↓
   POST /api/interviews/notes
   ↓
   Auto-save every 10s
   ↓
   Store: interview_notes table
```

## Technology Stack

```
┌─────────────────────────────────────────────┐
│              USER BROWSER                    │
│  React App (Vite) @ localhost:3000          │
└──────────────────┬──────────────────────────┘
                   │ HTTP/JSON
                   ↓
┌─────────────────────────────────────────────┐
│       CLOUDFLARE WORKER API                  │
│     @ localhost:8787 or workers.dev          │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │  Routing (itty-router)               │  │
│  │  • /api/positions                    │  │
│  │  • /api/applications                 │  │
│  │  • /api/summaries/generate           │  │
│  │  • /api/resumes                      │  │
│  │  • /api/interviews                   │  │
│  └──────────────┬───────────────────────┘  │
│                 │                           │
│  ┌──────────────┴───────────────────────┐  │
│  │  Services                            │  │
│  │  • claudeService.js                  │  │
│  │  • resumeService.js                  │  │
│  └──────────────┬───────────────────────┘  │
└─────────────────┼───────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ↓                 ↓
┌────────────────┐  ┌──────────────────────┐
│ Claude API     │  │  Cloudflare D1       │
│ (Anthropic)    │  │  (SQLite)            │
│                │  │                      │
│ • Haiku-4      │  │  Tables:             │
│ • Sonnet-4     │  │  • positions         │
└────────────────┘  │  • job_applications  │
                    │  • summaries         │
                    │  • resumes           │
                    │  • interviews        │
                    │  • notes             │
                    │  • prompts           │
                    └──────────────────────┘
```

## Component Hierarchy

```
App
├── Dashboard
│   ├── ApplicationsList (recent 5)
│   ├── StatusSummary
│   └── QuickActions
│
├── PositionsManager
│   ├── PositionsList
│   └── PositionForm
│       ├── BasicInfo
│       ├── AchievementsList
│       ├── SkillsInput
│       └── PerspectiveSelector
│
├── NewApplicationWizard
│   ├── Step1: JobDetailsForm
│   ├── Step2: PerspectiveSelector
│   ├── Step3: SummaryGenerator
│   └── Step4: ResumeBuilder
│
├── ApplicationDetail
│   ├── ApplicationHeader
│   └── TabContainer
│       ├── SummaryTab
│       ├── ResumeTab
│       │   ├── MarkdownEditor
│       │   └── MarkdownPreview
│       ├── PracticeInterviewTab
│       │   ├── GapAnalysis
│       │   ├── QuestionsList
│       │   └── CultureInsights
│       └── InterviewNotesTab
│           ├── InterviewersList
│           ├── NotesEditor
│           └── FollowupItems
│
├── SearchView
│   ├── SearchFilters
│   └── ResultsGrid
│
└── SettingsView
    ├── PromptTemplatesManager
    │   ├── TemplatesList
    │   └── TemplateEditor
    └── PerspectivesManager
        ├── PerspectivesList
        └── PerspectiveForm
```

## Database Relationships

```
positions
    ↓ (1:N via position_id)
generated_summaries
    ↓ (N:1 via application_id)
job_applications ─────┐
    ↓ (1:N)           ├─ (1:N) ─→ resumes
    ↓ (1:1)           ├─ (1:1) ─→ practice_interviews
    └ (1:N) ─────────→└─ (1:N) ─→ interview_notes

prompt_templates (used by summaries & interviews via prompt_version)
perspective_tags (referenced in JSON arrays)
```

## State Management Pattern

```
Component Level:
  useState for form inputs
  useEffect for data loading
  Custom hooks for reusable logic

API Calls:
  services/api.js (centralized)
  
Auto-save Pattern:
  useEffect with setTimeout (debounce)
  Clear timeout on unmount
  
Error Handling:
  try/catch in async functions
  Display errors in UI
  Console.log for debugging
```

## Key Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| **Cloudflare Workers** | Nearly free, global edge deployment, integrated D1 |
| **D1 (SQLite)** | Simpler than PostgreSQL, sufficient for single user, easy backups |
| **Claude Haiku for summaries** | Cost-effective ($0.25/$1.25 per MTok), sufficient quality |
| **Claude Sonnet for interviews** | Better reasoning for complex analysis, worth the extra cost |
| **Markdown for resumes** | Easy to edit, converts to HTML/PDF, ATS-friendly when converted |
| **JSON in SQLite** | Flexibility for arrays without complex schemas |
| **Perspective tags** | Multiple ranked perspectives → better targeting |
| **Auto-save** | Prevent data loss, better UX than manual save |
| **Split Markdown editor/preview** | Real-time feedback, easier than WYSIWYG |

## Performance Considerations

**Database**
- Indexes on frequently queried fields
- JSON fields for flexible arrays
- CASCADE deletes for cleanup
- Prepared statements for security

**API**
- Minimal data transfer (no over-fetching)
- Batch related queries (JOIN)
- Claude API caching (store prompts)

**Frontend**
- Code splitting by route
- Debounced auto-save
- Loading states for async operations

## Security Notes

**API Keys**
- Store in Worker secrets
- Never expose to frontend
- Rotate periodically

**Input Validation**
- SQL injection: parameterized queries
- XSS: sanitize Markdown rendering
- Required field validation

**Data Privacy**
- No third-party analytics on sensitive data
- User controls all data
- Easy export/delete

## Deployment Checklist

Backend:
- [ ] Database created: `wrangler d1 create`
- [ ] Schema initialized: `--file=schema.sql`
- [ ] API key set: `wrangler secret put`
- [ ] Worker deployed: `wrangler deploy`
- [ ] Health check passes

Frontend:
- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] Build succeeds: `npm run build`
- [ ] Pages deployed
- [ ] Production URL works

Testing:
- [ ] Create position
- [ ] Create application
- [ ] Generate summary (tests Claude API)
- [ ] Build resume
- [ ] Generate interview
- [ ] Take notes
- [ ] Search applications

## File Size Reference

```
backend/
├── schema.sql                ~8 KB
├── src/index.js             ~2 KB
├── src/routes/              ~40 KB total
├── src/services/            ~15 KB total
└── src/db/utils.js          ~2 KB

frontend/
├── src/services/api.js      ~8 KB
├── src/components/          ~60 KB total (with stubs)
└── src/App.jsx + styles     ~8 KB

Total implementation: ~150 KB
```

## Next Implementation Steps

1. **Complete ApplicationDetail** (highest priority)
   - Copy NewApplicationWizard pattern
   - Add tabs for different views
   - Implement Markdown editor in Resume tab

2. **Finish PositionsManager**
   - Table view with position cards
   - Modal form for add/edit
   - Delete with confirmation

3. **Polish NewApplicationWizard**
   - Add better loading states
   - Error recovery
   - Progress persistence

4. **Add mobile styles**
   - Responsive sidebar
   - Touch-friendly forms
   - Optimized for small screens

5. **Test end-to-end**
   - Real job descriptions
   - Claude API responses
   - Resume HTML output
   - Interview quality

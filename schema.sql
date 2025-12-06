-- Career Navigator Database Schema
-- SQLite schema for Cloudflare D1

-- ============================================================================
-- Core Tables
-- ============================================================================

-- Positions: User's historical work experience
CREATE TABLE positions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL, -- ISO 8601 date
  end_date TEXT, -- NULL if current position
  raw_description TEXT, -- Original job responsibilities
  achievements TEXT, -- JSON array of achievements
  skills_used TEXT, -- JSON array of skills/technologies
  perspective_tags TEXT, -- JSON array of perspectives (ranked)
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Job Applications: Tracking applications to companies
CREATE TABLE job_applications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company TEXT NOT NULL,
  position_title TEXT NOT NULL,
  job_description TEXT NOT NULL,
  job_url TEXT,
  perspective_focus TEXT NOT NULL, -- JSON array of ranked perspectives
  status TEXT DEFAULT 'researching' CHECK(status IN (
    'researching', 'applied', 'interviewing', 
    'offered', 'accepted', 'rejected', 'withdrawn'
  )),
  applied_date TEXT, -- ISO 8601 date
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Generated Summaries: AI-generated experience summaries
CREATE TABLE generated_summaries (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  application_id TEXT NOT NULL,
  position_id TEXT NOT NULL,
  generated_content TEXT NOT NULL, -- Markdown format
  prompt_used TEXT NOT NULL, -- Store for reproducibility
  prompt_version TEXT, -- Track which prompt template version
  model_used TEXT NOT NULL, -- e.g., 'claude-haiku-4-20250514'
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE,
  FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE
);

-- Resumes: Generated resumes for applications
CREATE TABLE resumes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  application_id TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  content TEXT NOT NULL, -- Markdown format
  formatted_html TEXT, -- Generated HTML for display/print
  is_final INTEGER DEFAULT 0 CHECK(is_final IN (0, 1)),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE
);

-- Practice Interviews: AI-generated interview preparation
CREATE TABLE practice_interviews (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  application_id TEXT NOT NULL,
  questions TEXT NOT NULL, -- JSON array of question objects
  culture_insights TEXT, -- JSON object with company culture info
  prompt_version TEXT, -- Track which prompt template version
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE
);

-- Interview Notes: User's notes from actual interviews
CREATE TABLE interview_notes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  application_id TEXT NOT NULL,
  interview_date TEXT, -- ISO 8601 datetime
  interviewers TEXT, -- JSON array of interviewer objects
  questions_asked TEXT, -- JSON array of questions
  my_responses TEXT, -- Markdown format
  followup_items TEXT, -- JSON array of follow-up actions
  overall_notes TEXT, -- Markdown format
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE
);

-- Prompt Templates: Configurable AI prompts
CREATE TABLE prompt_templates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN (
    'summary_generation', 'practice_interview', 'culture_analysis'
  )),
  template_content TEXT NOT NULL,
  variables TEXT, -- JSON object defining expected variables
  is_active INTEGER DEFAULT 0 CHECK(is_active IN (0, 1)),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Perspective Tags: Master list of available perspectives
CREATE TABLE perspective_tags (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tag TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX idx_applications_company ON job_applications(company);
CREATE INDEX idx_applications_status ON job_applications(status);
CREATE INDEX idx_applications_created ON job_applications(created_at DESC);

CREATE INDEX idx_summaries_application ON generated_summaries(application_id);
CREATE INDEX idx_summaries_position ON generated_summaries(position_id);

CREATE INDEX idx_resumes_application ON resumes(application_id);
CREATE INDEX idx_resumes_final ON resumes(is_final);

CREATE INDEX idx_practice_application ON practice_interviews(application_id);

CREATE INDEX idx_notes_application ON interview_notes(application_id);
CREATE INDEX idx_notes_date ON interview_notes(interview_date DESC);

CREATE INDEX idx_prompts_type_active ON prompt_templates(type, is_active);

CREATE INDEX idx_positions_created ON positions(created_at DESC);

-- ============================================================================
-- Initial Data
-- ============================================================================

-- Initial perspective tags
INSERT INTO perspective_tags (tag, display_name, description, sort_order) VALUES
  ('tpm', 'Technical Program Manager', 'Cross-functional program leadership, delivery orchestration', 1),
  ('security', 'Security & Compliance', 'AI security, audit controls, compliance frameworks', 2),
  ('data_engineering', 'Data Engineering', 'Data pipelines, analytics, infrastructure', 3),
  ('development', 'Software Development', 'Application development, coding, architecture', 4),
  ('release_management', 'Release Management', 'Deployment automation, CI/CD, DevOps', 5);

-- Default prompt template for summary generation
INSERT INTO prompt_templates (name, type, template_content, variables, is_active) VALUES (
  'Default Summary Generation',
  'summary_generation',
  'You are a career consultant helping a candidate frame their work experience for a specific job application.

**Context:**
The candidate is applying for: {{position_title}} at {{company}}

**Job Description:**
{{job_description}}

**Candidate''s Perspective Focus:**
The candidate wants to emphasize their experience as: {{perspective_focus}}

**Relevant Work History:**
{{positions_data}}

**Task:**
Generate a compelling summary of the candidate''s experience that:
1. Highlights achievements most relevant to this job description
2. Frames their experience through the lens of {{perspective_focus}}
3. Uses specific metrics and outcomes from their work history
4. Addresses key requirements mentioned in the job description
5. Is written in first person, suitable for a resume summary section

Format your response as a 3-4 paragraph summary in Markdown. Be specific and quantitative.',
  '{"position_title": "string", "company": "string", "job_description": "string", "perspective_focus": "string", "positions_data": "string"}',
  1
);

-- Default prompt template for practice interview generation
INSERT INTO prompt_templates (name, type, template_content, variables, is_active) VALUES (
  'Default Practice Interview',
  'practice_interview',
  'You are an interview coach helping a candidate prepare for a job interview.

**Context:**
Company: {{company}}
Position: {{position_title}}
Job URL: {{job_url}}

**Job Description:**
{{job_description}}

**Candidate''s Resume:**
{{resume_content}}

**Experience Summary:**
{{summary_content}}

**Task:**
Generate a comprehensive practice interview guide that includes:

1. **Gap Analysis**: Identify 2-3 areas where the candidate''s resume doesn''t perfectly match the job requirements
2. **Interview Questions**: Generate 8-10 likely interview questions, including:
   - Behavioral questions related to the role
   - Technical questions (if applicable)
   - Questions that probe the identified gaps
   - Culture fit questions
3. **Suggested Answers**: For each question, provide a suggested answer framework that:
   - Bridges any gaps with related experience
   - Highlights relevant achievements from their background
   - Demonstrates alignment with the role
4. **Culture Insights**: Based on the company and job description, provide:
   - Key company values to emphasize
   - Interview tips specific to this company/role
   - Questions the candidate should ask

**Output Format (JSON):**
```json
{
  "gap_analysis": [
    {
      "gap": "description of gap",
      "bridge_strategy": "how to address this gap"
    }
  ],
  "questions": [
    {
      "question": "interview question",
      "type": "behavioral|technical|culture_fit",
      "suggested_answer": "answer framework",
      "key_points": ["point 1", "point 2"],
      "gap_addressed": "which gap this addresses (if any)"
    }
  ],
  "culture_insights": {
    "company_values": ["value 1", "value 2"],
    "interview_tips": ["tip 1", "tip 2"],
    "questions_to_ask": ["question 1", "question 2"]
  }
}
```',
  '{"company": "string", "position_title": "string", "job_url": "string", "job_description": "string", "resume_content": "string", "summary_content": "string"}',
  1
);

-- ============================================================================
-- Triggers for updated_at timestamps
-- ============================================================================

CREATE TRIGGER update_positions_timestamp 
AFTER UPDATE ON positions
BEGIN
  UPDATE positions SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_applications_timestamp 
AFTER UPDATE ON job_applications
BEGIN
  UPDATE job_applications SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_interview_notes_timestamp 
AFTER UPDATE ON interview_notes
BEGIN
  UPDATE interview_notes SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_prompt_templates_timestamp 
AFTER UPDATE ON prompt_templates
BEGIN
  UPDATE prompt_templates SET updated_at = datetime('now') WHERE id = NEW.id;
END;

/**
 * Applications Routes
 * Manage job applications
 */

import { Router } from 'itty-router';
import { query, queryOne, execute, parseJSON, toJSON } from '../db/utils';

const router = Router({ base: '/api/applications' });

// List all applications
router.get('/', async (request) => {
  const db = request.env.DB;
  
  const applications = await query(
    db,
    `SELECT * FROM job_applications ORDER BY created_at DESC`
  );

  const formatted = applications.map((app) => ({
    ...app,
    perspective_focus: parseJSON(app.perspective_focus, []),
  }));

  return new Response(JSON.stringify(formatted), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Get single application with all related data
router.get('/:id', async (request) => {
  const db = request.env.DB;
  const { id } = request.params;

  const application = await queryOne(
    db,
    `SELECT * FROM job_applications WHERE id = ?`,
    [id]
  );

  if (!application) {
    return new Response(JSON.stringify({ error: 'Application not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get related summaries
  const summaries = await query(
    db,
    `SELECT * FROM generated_summaries WHERE application_id = ? ORDER BY created_at DESC`,
    [id]
  );

  // Get related resumes
  const resumes = await query(
    db,
    `SELECT * FROM resumes WHERE application_id = ? ORDER BY version DESC`,
    [id]
  );

  // Get practice interview
  const practiceInterview = await queryOne(
    db,
    `SELECT * FROM practice_interviews WHERE application_id = ?`,
    [id]
  );

  // Get interview notes
  const interviewNotes = await query(
    db,
    `SELECT * FROM interview_notes WHERE application_id = ? ORDER BY interview_date DESC`,
    [id]
  );

  const formatted = {
    ...application,
    perspective_focus: parseJSON(application.perspective_focus, []),
    summaries: summaries.map((s) => ({
      ...s,
      // Keep generated_content as-is (Markdown)
    })),
    resumes: resumes.map((r) => ({
      ...r,
      is_final: Boolean(r.is_final),
    })),
    practice_interview: practiceInterview
      ? {
          ...practiceInterview,
          questions: parseJSON(practiceInterview.questions, []),
          culture_insights: parseJSON(practiceInterview.culture_insights, {}),
        }
      : null,
    interview_notes: interviewNotes.map((n) => ({
      ...n,
      interviewers: parseJSON(n.interviewers, []),
      questions_asked: parseJSON(n.questions_asked, []),
      followup_items: parseJSON(n.followup_items, []),
    })),
  };

  return new Response(JSON.stringify(formatted), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Create application
router.post('/', async (request) => {
  const db = request.env.DB;
  const body = await request.json();

  const {
    company,
    position_title,
    job_description,
    job_url,
    perspective_focus,
    status,
    applied_date,
  } = body;

  if (!company || !position_title || !job_description || !perspective_focus) {
    return new Response(
      JSON.stringify({
        error: 'Missing required fields: company, position_title, job_description, perspective_focus',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const id = crypto.randomUUID().replace(/-/g, '');

  await execute(
    db,
    `INSERT INTO job_applications (
      id, company, position_title, job_description, job_url,
      perspective_focus, status, applied_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      company,
      position_title,
      job_description,
      job_url || null,
      toJSON(perspective_focus),
      status || 'researching',
      applied_date || null,
    ]
  );

  const application = await queryOne(
    db,
    `SELECT * FROM job_applications WHERE id = ?`,
    [id]
  );

  const formatted = {
    ...application,
    perspective_focus: parseJSON(application.perspective_focus, []),
  };

  return new Response(JSON.stringify(formatted), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
});

// Update application
router.put('/:id', async (request) => {
  const db = request.env.DB;
  const { id } = request.params;
  const body = await request.json();

  const existing = await queryOne(
    db,
    `SELECT id FROM job_applications WHERE id = ?`,
    [id]
  );
  
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Application not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const {
    company,
    position_title,
    job_description,
    job_url,
    perspective_focus,
    status,
    applied_date,
  } = body;

  await execute(
    db,
    `UPDATE job_applications SET
      company = ?,
      position_title = ?,
      job_description = ?,
      job_url = ?,
      perspective_focus = ?,
      status = ?,
      applied_date = ?
    WHERE id = ?`,
    [
      company,
      position_title,
      job_description,
      job_url || null,
      toJSON(perspective_focus),
      status,
      applied_date || null,
      id,
    ]
  );

  const application = await queryOne(
    db,
    `SELECT * FROM job_applications WHERE id = ?`,
    [id]
  );

  const formatted = {
    ...application,
    perspective_focus: parseJSON(application.perspective_focus, []),
  };

  return new Response(JSON.stringify(formatted), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Delete application
router.delete('/:id', async (request) => {
  const db = request.env.DB;
  const { id } = request.params;

  const existing = await queryOne(
    db,
    `SELECT id FROM job_applications WHERE id = ?`,
    [id]
  );
  
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Application not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await execute(db, `DELETE FROM job_applications WHERE id = ?`, [id]);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

export default router;

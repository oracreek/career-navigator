/**
 * Resumes Routes
 * Manage resume versions and generation
 */

import { Router } from 'itty-router';
import { query, queryOne, execute } from '../db/utils';
import { markdownToHTML } from '../services/resumeService';

const router = Router({ base: '/api/resumes' });

// Get resumes for an application
router.get('/application/:application_id', async (request) => {
  const db = request.env.DB;
  const { application_id } = request.params;

  const resumes = await query(
    db,
    `SELECT * FROM resumes WHERE application_id = ? ORDER BY version DESC`,
    [application_id]
  );

  const formatted = resumes.map((r) => ({
    ...r,
    is_final: Boolean(r.is_final),
  }));

  return new Response(JSON.stringify(formatted), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Get single resume
router.get('/:id', async (request) => {
  const db = request.env.DB;
  const { id } = request.params;

  const resume = await queryOne(db, `SELECT * FROM resumes WHERE id = ?`, [id]);

  if (!resume) {
    return new Response(JSON.stringify({ error: 'Resume not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const formatted = {
    ...resume,
    is_final: Boolean(resume.is_final),
  };

  return new Response(JSON.stringify(formatted), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Create or update resume (auto-save)
router.post('/', async (request) => {
  const db = request.env.DB;
  const body = await request.json();

  const { application_id, content } = body;

  if (!application_id || !content) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: application_id, content' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check if a draft resume exists for this application
  const existingDraft = await queryOne(
    db,
    `SELECT * FROM resumes WHERE application_id = ? AND is_final = 0 ORDER BY version DESC LIMIT 1`,
    [application_id]
  );

  let resume;

  if (existingDraft) {
    // Update existing draft
    await execute(
      db,
      `UPDATE resumes SET content = ? WHERE id = ?`,
      [content, existingDraft.id]
    );
    
    resume = await queryOne(db, `SELECT * FROM resumes WHERE id = ?`, [existingDraft.id]);
  } else {
    // Create new draft
    const id = crypto.randomUUID().replace(/-/g, '');
    const version = 1;

    await execute(
      db,
      `INSERT INTO resumes (id, application_id, version, content, is_final)
       VALUES (?, ?, ?, ?, 0)`,
      [id, application_id, version, content]
    );

    resume = await queryOne(db, `SELECT * FROM resumes WHERE id = ?`, [id]);
  }

  const formatted = {
    ...resume,
    is_final: Boolean(resume.is_final),
  };

  return new Response(JSON.stringify(formatted), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
});

// Finalize resume (convert to HTML and mark as final)
router.post('/:id/finalize', async (request) => {
  const db = request.env.DB;
  const { id } = request.params;

  const resume = await queryOne(db, `SELECT * FROM resumes WHERE id = ?`, [id]);

  if (!resume) {
    return new Response(JSON.stringify({ error: 'Resume not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Convert Markdown to HTML
    const html = markdownToHTML(resume.content);

    // Update resume
    await execute(
      db,
      `UPDATE resumes SET formatted_html = ?, is_final = 1 WHERE id = ?`,
      [html, id]
    );

    const updatedResume = await queryOne(db, `SELECT * FROM resumes WHERE id = ?`, [id]);

    const formatted = {
      ...updatedResume,
      is_final: Boolean(updatedResume.is_final),
    };

    return new Response(JSON.stringify(formatted), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Resume finalization error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to finalize resume',
        details: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

export default router;

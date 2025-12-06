/**
 * Interviews Routes
 * Generate practice interviews and manage interview notes
 */

import { Router } from 'itty-router';
import { query, queryOne, execute, parseJSON, toJSON } from '../db/utils';
import { generatePracticeInterview } from '../services/claudeService';

const router = Router({ base: '/api/interviews' });

// Generate practice interview
router.post('/generate', async (request) => {
  const db = request.env.DB;
  const apiKey = request.env.ANTHROPIC_API_KEY;
  const body = await request.json();

  const { application_id } = body;

  if (!application_id) {
    return new Response(JSON.stringify({ error: 'Missing application_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get application details
  const application = await queryOne(
    db,
    `SELECT * FROM job_applications WHERE id = ?`,
    [application_id]
  );

  if (!application) {
    return new Response(JSON.stringify({ error: 'Application not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get final resume for this application
  const finalResume = await queryOne(
    db,
    `SELECT * FROM resumes WHERE application_id = ? AND is_final = 1 ORDER BY created_at DESC LIMIT 1`,
    [application_id]
  );

  if (!finalResume) {
    return new Response(
      JSON.stringify({
        error: 'No finalized resume found',
        suggestion: 'Please finalize a resume before generating practice interview',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get most recent summary
  const summary = await queryOne(
    db,
    `SELECT * FROM generated_summaries WHERE application_id = ? ORDER BY created_at DESC LIMIT 1`,
    [application_id]
  );

  // Get active prompt template
  const promptTemplate = await queryOne(
    db,
    `SELECT * FROM prompt_templates WHERE type = 'practice_interview' AND is_active = 1 LIMIT 1`
  );

  if (!promptTemplate) {
    return new Response(
      JSON.stringify({ error: 'No active prompt template found for practice interviews' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Generate practice interview using Claude
    const interviewData = await generatePracticeInterview(apiKey, {
      jobDescription: application.job_description,
      positionTitle: application.position_title,
      company: application.company,
      jobUrl: application.job_url,
      resumeContent: finalResume.content,
      summaryContent: summary?.generated_content || '',
      promptTemplate: promptTemplate.template_content,
    });

    // Delete any existing practice interview for this application
    await execute(
      db,
      `DELETE FROM practice_interviews WHERE application_id = ?`,
      [application_id]
    );

    // Store practice interview
    const id = crypto.randomUUID().replace(/-/g, '');

    await execute(
      db,
      `INSERT INTO practice_interviews (
        id, application_id, questions, culture_insights, prompt_version
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        application_id,
        toJSON(interviewData.questions || []),
        toJSON(interviewData.culture_insights || {}),
        promptTemplate.id,
      ]
    );

    const practiceInterview = await queryOne(
      db,
      `SELECT * FROM practice_interviews WHERE id = ?`,
      [id]
    );

    const formatted = {
      ...practiceInterview,
      questions: parseJSON(practiceInterview.questions, []),
      culture_insights: parseJSON(practiceInterview.culture_insights, {}),
      gap_analysis: interviewData.gap_analysis || [],
    };

    return new Response(JSON.stringify(formatted), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Practice interview generation error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate practice interview',
        details: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Get practice interview for application
router.get('/practice/:application_id', async (request) => {
  const db = request.env.DB;
  const { application_id } = request.params;

  const practiceInterview = await queryOne(
    db,
    `SELECT * FROM practice_interviews WHERE application_id = ?`,
    [application_id]
  );

  if (!practiceInterview) {
    return new Response(
      JSON.stringify({ error: 'No practice interview found for this application' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const formatted = {
    ...practiceInterview,
    questions: parseJSON(practiceInterview.questions, []),
    culture_insights: parseJSON(practiceInterview.culture_insights, {}),
  };

  return new Response(JSON.stringify(formatted), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Create interview note
router.post('/notes', async (request) => {
  const db = request.env.DB;
  const body = await request.json();

  const {
    application_id,
    interview_date,
    interviewers,
    questions_asked,
    my_responses,
    followup_items,
    overall_notes,
  } = body;

  if (!application_id) {
    return new Response(JSON.stringify({ error: 'Missing application_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = crypto.randomUUID().replace(/-/g, '');

  await execute(
    db,
    `INSERT INTO interview_notes (
      id, application_id, interview_date, interviewers,
      questions_asked, my_responses, followup_items, overall_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      application_id,
      interview_date || null,
      toJSON(interviewers),
      toJSON(questions_asked),
      my_responses || '',
      toJSON(followup_items),
      overall_notes || '',
    ]
  );

  const note = await queryOne(db, `SELECT * FROM interview_notes WHERE id = ?`, [id]);

  const formatted = {
    ...note,
    interviewers: parseJSON(note.interviewers, []),
    questions_asked: parseJSON(note.questions_asked, []),
    followup_items: parseJSON(note.followup_items, []),
  };

  return new Response(JSON.stringify(formatted), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
});

// Update interview note
router.put('/notes/:id', async (request) => {
  const db = request.env.DB;
  const { id } = request.params;
  const body = await request.json();

  const existing = await queryOne(db, `SELECT id FROM interview_notes WHERE id = ?`, [id]);

  if (!existing) {
    return new Response(JSON.stringify({ error: 'Interview note not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const {
    interview_date,
    interviewers,
    questions_asked,
    my_responses,
    followup_items,
    overall_notes,
  } = body;

  await execute(
    db,
    `UPDATE interview_notes SET
      interview_date = ?,
      interviewers = ?,
      questions_asked = ?,
      my_responses = ?,
      followup_items = ?,
      overall_notes = ?
    WHERE id = ?`,
    [
      interview_date || null,
      toJSON(interviewers),
      toJSON(questions_asked),
      my_responses || '',
      toJSON(followup_items),
      overall_notes || '',
      id,
    ]
  );

  const note = await queryOne(db, `SELECT * FROM interview_notes WHERE id = ?`, [id]);

  const formatted = {
    ...note,
    interviewers: parseJSON(note.interviewers, []),
    questions_asked: parseJSON(note.questions_asked, []),
    followup_items: parseJSON(note.followup_items, []),
  };

  return new Response(JSON.stringify(formatted), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Get interview notes for application
router.get('/notes/application/:application_id', async (request) => {
  const db = request.env.DB;
  const { application_id } = request.params;

  const notes = await query(
    db,
    `SELECT * FROM interview_notes WHERE application_id = ? ORDER BY interview_date DESC`,
    [application_id]
  );

  const formatted = notes.map((n) => ({
    ...n,
    interviewers: parseJSON(n.interviewers, []),
    questions_asked: parseJSON(n.questions_asked, []),
    followup_items: parseJSON(n.followup_items, []),
  }));

  return new Response(JSON.stringify(formatted), {
    headers: { 'Content-Type': 'application/json' },
  });
});

export default router;

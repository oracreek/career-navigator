/**
 * Summaries Routes
 * Generate AI summaries of experience
 */

import { Router } from 'itty-router';
import { query, queryOne, execute, parseJSON, toJSON } from '../db/utils';
import { generateSummary } from '../services/claudeService';

const router = Router({ base: '/api/summaries' });

// Generate summary for an application
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

  const perspectiveFocus = parseJSON(application.perspective_focus, []);
  
  // Get positions that match the perspective tags
  const allPositions = await query(db, `SELECT * FROM positions ORDER BY start_date DESC`);
  
  // Filter positions by perspective match
  const matchingPositions = allPositions.filter((pos) => {
    const posTags = parseJSON(pos.perspective_tags, []);
    return perspectiveFocus.some((pf) => posTags.includes(pf));
  });

  if (matchingPositions.length === 0) {
    return new Response(
      JSON.stringify({
        error: 'No positions found matching the selected perspectives',
        suggestion: 'Add positions with these perspective tags or select different perspectives',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get active prompt template for summary generation
  const promptTemplate = await queryOne(
    db,
    `SELECT * FROM prompt_templates WHERE type = 'summary_generation' AND is_active = 1 LIMIT 1`
  );

  if (!promptTemplate) {
    return new Response(
      JSON.stringify({ error: 'No active prompt template found for summary generation' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Generate summary using Claude
    const summaryContent = await generateSummary(apiKey, {
      jobDescription: application.job_description,
      positionTitle: application.position_title,
      company: application.company,
      perspectiveFocus: perspectiveFocus.join(', '),
      positions: matchingPositions,
      promptTemplate: promptTemplate.template_content,
    });

    // Store summaries for each position used
    const summaryIds = [];
    
    for (const position of matchingPositions) {
      const summaryId = crypto.randomUUID().replace(/-/g, '');
      
      await execute(
        db,
        `INSERT INTO generated_summaries (
          id, application_id, position_id, generated_content,
          prompt_used, prompt_version, model_used
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          summaryId,
          application_id,
          position.id,
          summaryContent,
          promptTemplate.template_content,
          promptTemplate.id,
          'claude-haiku-4-20250514',
        ]
      );
      
      summaryIds.push(summaryId);
    }

    // Return the generated summary
    return new Response(
      JSON.stringify({
        summary: summaryContent,
        positions_used: matchingPositions.length,
        summary_ids: summaryIds,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Summary generation error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate summary',
        details: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Get summaries for an application
router.get('/application/:application_id', async (request) => {
  const db = request.env.DB;
  const { application_id } = request.params;

  const summaries = await query(
    db,
    `SELECT * FROM generated_summaries WHERE application_id = ? ORDER BY created_at DESC`,
    [application_id]
  );

  return new Response(JSON.stringify(summaries), {
    headers: { 'Content-Type': 'application/json' },
  });
});

export default router;

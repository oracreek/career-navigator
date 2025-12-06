/**
 * Prompts Routes
 * Manage AI prompt templates
 */

import { Router } from 'itty-router';
import { query, queryOne, execute, parseJSON, toJSON } from '../db/utils';
import { testPromptInterpolation } from '../services/claudeService';

const router = Router({ base: '/api/prompts' });

// List all prompt templates
router.get('/', async (request) => {
  const db = request.env.DB;

  const prompts = await query(
    db,
    `SELECT * FROM prompt_templates ORDER BY type, created_at DESC`
  );

  const formatted = prompts.map((p) => ({
    ...p,
    variables: parseJSON(p.variables, {}),
    is_active: Boolean(p.is_active),
  }));

  return new Response(JSON.stringify(formatted), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Get single prompt template
router.get('/:id', async (request) => {
  const db = request.env.DB;
  const { id } = request.params;

  const prompt = await queryOne(db, `SELECT * FROM prompt_templates WHERE id = ?`, [id]);

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Prompt template not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const formatted = {
    ...prompt,
    variables: parseJSON(prompt.variables, {}),
    is_active: Boolean(prompt.is_active),
  };

  return new Response(JSON.stringify(formatted), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Create prompt template
router.post('/', async (request) => {
  const db = request.env.DB;
  const body = await request.json();

  const { name, type, template_content, variables, is_active } = body;

  if (!name || !type || !template_content) {
    return new Response(
      JSON.stringify({
        error: 'Missing required fields: name, type, template_content',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const validTypes = ['summary_generation', 'practice_interview', 'culture_analysis'];
  if (!validTypes.includes(type)) {
    return new Response(
      JSON.stringify({
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const id = crypto.randomUUID().replace(/-/g, '');

  // If this is being set as active, deactivate others of the same type
  if (is_active) {
    await execute(
      db,
      `UPDATE prompt_templates SET is_active = 0 WHERE type = ?`,
      [type]
    );
  }

  await execute(
    db,
    `INSERT INTO prompt_templates (
      id, name, type, template_content, variables, is_active
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      name,
      type,
      template_content,
      toJSON(variables),
      is_active ? 1 : 0,
    ]
  );

  const prompt = await queryOne(db, `SELECT * FROM prompt_templates WHERE id = ?`, [id]);

  const formatted = {
    ...prompt,
    variables: parseJSON(prompt.variables, {}),
    is_active: Boolean(prompt.is_active),
  };

  return new Response(JSON.stringify(formatted), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
});

// Update prompt template
router.put('/:id', async (request) => {
  const db = request.env.DB;
  const { id } = request.params;
  const body = await request.json();

  const existing = await queryOne(
    db,
    `SELECT * FROM prompt_templates WHERE id = ?`,
    [id]
  );

  if (!existing) {
    return new Response(JSON.stringify({ error: 'Prompt template not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { name, template_content, variables, is_active } = body;

  // If this is being set as active, deactivate others of the same type
  if (is_active && !existing.is_active) {
    await execute(
      db,
      `UPDATE prompt_templates SET is_active = 0 WHERE type = ? AND id != ?`,
      [existing.type, id]
    );
  }

  await execute(
    db,
    `UPDATE prompt_templates SET
      name = ?,
      template_content = ?,
      variables = ?,
      is_active = ?
    WHERE id = ?`,
    [
      name || existing.name,
      template_content || existing.template_content,
      toJSON(variables) || existing.variables,
      is_active ? 1 : 0,
      id,
    ]
  );

  const prompt = await queryOne(db, `SELECT * FROM prompt_templates WHERE id = ?`, [id]);

  const formatted = {
    ...prompt,
    variables: parseJSON(prompt.variables, {}),
    is_active: Boolean(prompt.is_active),
  };

  return new Response(JSON.stringify(formatted), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Delete prompt template
router.delete('/:id', async (request) => {
  const db = request.env.DB;
  const { id } = request.params;

  const existing = await queryOne(
    db,
    `SELECT id FROM prompt_templates WHERE id = ?`,
    [id]
  );

  if (!existing) {
    return new Response(JSON.stringify({ error: 'Prompt template not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await execute(db, `DELETE FROM prompt_templates WHERE id = ?`, [id]);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Test prompt interpolation
router.post('/:id/test', async (request) => {
  const db = request.env.DB;
  const { id } = request.params;
  const body = await request.json();

  const prompt = await queryOne(db, `SELECT * FROM prompt_templates WHERE id = ?`, [id]);

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Prompt template not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { test_variables } = body;

  if (!test_variables) {
    return new Response(
      JSON.stringify({ error: 'Missing test_variables' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const interpolated = testPromptInterpolation(
      prompt.template_content,
      test_variables
    );

    return new Response(
      JSON.stringify({
        original: prompt.template_content,
        interpolated,
        variables_used: test_variables,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Interpolation failed',
        details: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

export default router;

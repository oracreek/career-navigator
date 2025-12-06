/**
 * Perspectives Routes
 * Manage perspective tags
 */

import { Router } from 'itty-router';
import { query, queryOne, execute } from '../db/utils';

const router = Router({ base: '/api/perspectives' });

// List all perspective tags
router.get('/', async (request) => {
  const db = request.env.DB;

  const perspectives = await query(
    db,
    `SELECT * FROM perspective_tags ORDER BY sort_order, display_name`
  );

  return new Response(JSON.stringify(perspectives), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Create perspective tag
router.post('/', async (request) => {
  const db = request.env.DB;
  const body = await request.json();

  const { tag, display_name, description, sort_order } = body;

  if (!tag || !display_name) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: tag, display_name' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check if tag already exists
  const existing = await queryOne(
    db,
    `SELECT id FROM perspective_tags WHERE tag = ?`,
    [tag]
  );

  if (existing) {
    return new Response(
      JSON.stringify({ error: 'Perspective tag already exists' }),
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const id = crypto.randomUUID().replace(/-/g, '');

  await execute(
    db,
    `INSERT INTO perspective_tags (id, tag, display_name, description, sort_order)
     VALUES (?, ?, ?, ?, ?)`,
    [
      id,
      tag,
      display_name,
      description || null,
      sort_order || 999,
    ]
  );

  const perspective = await queryOne(
    db,
    `SELECT * FROM perspective_tags WHERE id = ?`,
    [id]
  );

  return new Response(JSON.stringify(perspective), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
});

// Update perspective tag
router.put('/:id', async (request) => {
  const db = request.env.DB;
  const { id } = request.params;
  const body = await request.json();

  const existing = await queryOne(
    db,
    `SELECT * FROM perspective_tags WHERE id = ?`,
    [id]
  );

  if (!existing) {
    return new Response(JSON.stringify({ error: 'Perspective tag not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { tag, display_name, description, sort_order } = body;

  await execute(
    db,
    `UPDATE perspective_tags SET
      tag = ?,
      display_name = ?,
      description = ?,
      sort_order = ?
    WHERE id = ?`,
    [
      tag || existing.tag,
      display_name || existing.display_name,
      description !== undefined ? description : existing.description,
      sort_order !== undefined ? sort_order : existing.sort_order,
      id,
    ]
  );

  const perspective = await queryOne(
    db,
    `SELECT * FROM perspective_tags WHERE id = ?`,
    [id]
  );

  return new Response(JSON.stringify(perspective), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Delete perspective tag
router.delete('/:id', async (request) => {
  const db = request.env.DB;
  const { id } = request.params;

  const existing = await queryOne(
    db,
    `SELECT id FROM perspective_tags WHERE id = ?`,
    [id]
  );

  if (!existing) {
    return new Response(JSON.stringify({ error: 'Perspective tag not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await execute(db, `DELETE FROM perspective_tags WHERE id = ?`, [id]);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

export default router;

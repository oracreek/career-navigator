/**
 * Positions Routes
 * Manage work history positions
 */

import { Router } from 'itty-router';
import { query, queryOne, execute, parseJSON, toJSON } from '../db/utils';

const router = Router({ base: '/api/positions' });

// List all positions
router.get('/', async (request) => {
  const db = request.env.DB;
  
  const positions = await query(
    db,
    `SELECT * FROM positions ORDER BY start_date DESC`
  );

  // Parse JSON fields
  const formatted = positions.map((p) => ({
    ...p,
    achievements: parseJSON(p.achievements, []),
    skills_used: parseJSON(p.skills_used, []),
    perspective_tags: parseJSON(p.perspective_tags, []),
  }));

  return new Response(JSON.stringify(formatted), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Get single position
router.get('/:id', async (request) => {
  const db = request.env.DB;
  const { id } = request.params;

  const position = await queryOne(
    db,
    `SELECT * FROM positions WHERE id = ?`,
    [id]
  );

  if (!position) {
    return new Response(JSON.stringify({ error: 'Position not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse JSON fields
  const formatted = {
    ...position,
    achievements: parseJSON(position.achievements, []),
    skills_used: parseJSON(position.skills_used, []),
    perspective_tags: parseJSON(position.perspective_tags, []),
  };

  return new Response(JSON.stringify(formatted), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Create position
router.post('/', async (request) => {
  const db = request.env.DB;
  const body = await request.json();

  const {
    company,
    title,
    start_date,
    end_date,
    raw_description,
    achievements,
    skills_used,
    perspective_tags,
  } = body;

  if (!company || !title || !start_date) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: company, title, start_date' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const id = crypto.randomUUID().replace(/-/g, '');

  await execute(
    db,
    `INSERT INTO positions (
      id, company, title, start_date, end_date, 
      raw_description, achievements, skills_used, perspective_tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      company,
      title,
      start_date,
      end_date || null,
      raw_description || null,
      toJSON(achievements),
      toJSON(skills_used),
      toJSON(perspective_tags),
    ]
  );

  const position = await queryOne(db, `SELECT * FROM positions WHERE id = ?`, [id]);

  const formatted = {
    ...position,
    achievements: parseJSON(position.achievements, []),
    skills_used: parseJSON(position.skills_used, []),
    perspective_tags: parseJSON(position.perspective_tags, []),
  };

  return new Response(JSON.stringify(formatted), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
});

// Update position
router.put('/:id', async (request) => {
  const db = request.env.DB;
  const { id } = request.params;
  const body = await request.json();

  // Check if position exists
  const existing = await queryOne(db, `SELECT id FROM positions WHERE id = ?`, [id]);
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Position not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const {
    company,
    title,
    start_date,
    end_date,
    raw_description,
    achievements,
    skills_used,
    perspective_tags,
  } = body;

  await execute(
    db,
    `UPDATE positions SET
      company = ?,
      title = ?,
      start_date = ?,
      end_date = ?,
      raw_description = ?,
      achievements = ?,
      skills_used = ?,
      perspective_tags = ?
    WHERE id = ?`,
    [
      company,
      title,
      start_date,
      end_date || null,
      raw_description || null,
      toJSON(achievements),
      toJSON(skills_used),
      toJSON(perspective_tags),
      id,
    ]
  );

  const position = await queryOne(db, `SELECT * FROM positions WHERE id = ?`, [id]);

  const formatted = {
    ...position,
    achievements: parseJSON(position.achievements, []),
    skills_used: parseJSON(position.skills_used, []),
    perspective_tags: parseJSON(position.perspective_tags, []),
  };

  return new Response(JSON.stringify(formatted), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Delete position
router.delete('/:id', async (request) => {
  const db = request.env.DB;
  const { id } = request.params;

  const existing = await queryOne(db, `SELECT id FROM positions WHERE id = ?`, [id]);
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Position not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await execute(db, `DELETE FROM positions WHERE id = ?`, [id]);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

export default router;

/**
 * Search Routes
 * Search and filter applications
 */

import { Router } from 'itty-router';
import { query, parseJSON } from '../db/utils';

const router = Router({ base: '/api/search' });

// Search applications
router.get('/', async (request) => {
  const db = request.env.DB;
  const url = new URL(request.url);

  // Extract search parameters
  const company = url.searchParams.get('company');
  const status = url.searchParams.get('status');
  const perspective = url.searchParams.get('perspective');
  const searchText = url.searchParams.get('q');
  const startDate = url.searchParams.get('start_date');
  const endDate = url.searchParams.get('end_date');

  // Build dynamic query
  let sql = `SELECT * FROM job_applications WHERE 1=1`;
  const params = [];

  if (company) {
    sql += ` AND company LIKE ?`;
    params.push(`%${company}%`);
  }

  if (status) {
    sql += ` AND status = ?`;
    params.push(status);
  }

  if (searchText) {
    sql += ` AND (
      company LIKE ? OR 
      position_title LIKE ? OR 
      job_description LIKE ?
    )`;
    params.push(`%${searchText}%`, `%${searchText}%`, `%${searchText}%`);
  }

  if (startDate) {
    sql += ` AND created_at >= ?`;
    params.push(startDate);
  }

  if (endDate) {
    sql += ` AND created_at <= ?`;
    params.push(endDate);
  }

  sql += ` ORDER BY created_at DESC`;

  const applications = await query(db, sql, params);

  // Filter by perspective if specified (JSON field)
  let results = applications;
  if (perspective) {
    results = applications.filter((app) => {
      const perspectives = parseJSON(app.perspective_focus, []);
      return perspectives.includes(perspective);
    });
  }

  const formatted = results.map((app) => ({
    ...app,
    perspective_focus: parseJSON(app.perspective_focus, []),
  }));

  return new Response(JSON.stringify(formatted), {
    headers: { 'Content-Type': 'application/json' },
  });
});

export default router;

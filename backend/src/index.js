/**
 * Career Navigator - Cloudflare Worker
 * Main API server
 */

import { Router } from 'itty-router';
import positionsRoutes from './routes/positions';
import applicationsRoutes from './routes/applications';
import summariesRoutes from './routes/summaries';
import resumesRoutes from './routes/resumes';
import interviewsRoutes from './routes/interviews';
import promptsRoutes from './routes/prompts';
import searchRoutes from './routes/search';
import perspectivesRoutes from './routes/perspectives';

// CORS middleware
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function cors(response) {
  return new Response(response.body, {
    status: response.status,
    headers: {
      ...response.headers,
      ...corsHeaders,
    },
  });
}

// Error handling middleware
function handleError(error) {
  console.error('API Error:', error);
  return cors(
    new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        stack: error.stack,
      }),
      {
        status: error.status || 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  );
}

// Create router
const router = Router();

// Health check
router.get('/health', () => {
  return cors(
    new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
      headers: { 'Content-Type': 'application/json' },
    })
  );
});

// Handle OPTIONS for CORS
router.options('*', () => {
  return new Response(null, { headers: corsHeaders });
});

// Mount route modules
router.all('/api/positions/*', positionsRoutes.handle);
router.all('/api/applications/*', applicationsRoutes.handle);
router.all('/api/summaries/*', summariesRoutes.handle);
router.all('/api/resumes/*', resumesRoutes.handle);
router.all('/api/interviews/*', interviewsRoutes.handle);
router.all('/api/prompts/*', promptsRoutes.handle);
router.all('/api/search/*', searchRoutes.handle);
router.all('/api/perspectives/*', perspectivesRoutes.handle);

// 404 handler
router.all('*', () => {
  return cors(
    new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  );
});

// Main worker fetch handler
export default {
  async fetch(request, env, ctx) {
    try {
      // Attach environment to request for routes
      request.env = env;
      return await router.handle(request).catch(handleError);
    } catch (error) {
      return handleError(error);
    }
  },
};

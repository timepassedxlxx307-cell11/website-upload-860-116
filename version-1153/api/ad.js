import { readTargets, selectTarget } from '../lib/targets.js';

const HEADERS = {
  'cache-control': 'no-store',
  'content-type': 'application/json; charset=utf-8',
  'x-content-type-options': 'nosniff'
};

export async function GET() {
  try {
    const urls = await readTargets();
    return new Response(JSON.stringify({ url: selectTarget(urls) }), { headers: HEADERS });
  } catch (error) {
    console.error('Ad target unavailable:', error.code || error.name);
    return new Response(JSON.stringify({ error: 'unavailable' }), { status: 503, headers: HEADERS });
  }
}

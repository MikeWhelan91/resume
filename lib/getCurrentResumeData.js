export async function getCurrentResumeData(req) {
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    return body.data || body;
  }
  return {};
}

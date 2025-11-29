import type { VercelRequest, VercelResponse } from '@vercel/node';

const RPC_ENDPOINT = 'https://node.testnet.casper.network/rpc';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📡 Proxying request to Casper RPC:', req.body.method);

    // Forward the request to the Casper RPC endpoint
    const response = await fetch(RPC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    console.log('📥 Received response from Casper:', {
      status: response.status,
      hasError: !!data.error,
      errorCode: data.error?.code,
      errorMessage: data.error?.message,
    });

    // Return the response from the RPC endpoint
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('❌ RPC proxy error:', error);
    return res.status(500).json({
      error: 'Failed to proxy RPC request',
      details: error.message
    });
  }
}

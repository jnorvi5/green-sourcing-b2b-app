import type { NextApiRequest, NextApiResponse } from 'next';
import { AzureEmailer } from '../../lib/azure/emailer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { recipient, topic, context } = req.body;
  const agent = new AzureEmailer();

  try {
    const draft = await agent.draftEmail(recipient, topic, context);
    res.status(200).json({ draft });
  } catch (error) {
    res.status(500).json({ error: 'Failed to draft email' });
  }
}

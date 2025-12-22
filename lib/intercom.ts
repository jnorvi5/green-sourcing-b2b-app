export async function createRFQConversation(
  rfqId: string,
  architectId: string,
  supplierId: string,
  rfqDetails: any
) {
  const token = process.env['INTERCOM_ACCESS_TOKEN'];

  if (!token) {
    console.error('Missing Intercom Access Token');
    return { id: `mock_conv_${Date.now()}` };
  }

  try {
    const res = await fetch('https://api.intercom.io/conversations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { type: 'user', id: architectId },
        body: `RFQ Discussion\nMaterials: ${rfqDetails.materials?.join(', ')}\nBudget: $${rfqDetails.budget}\nTimeline: ${rfqDetails.timeline}`,
        custom_attributes: {
          rfq_id: rfqId,
          architect_id: architectId,
          supplier_id: supplierId,
        },
      }),
    })

    return await res.json()
  } catch (error) {
    console.error('Intercom API error:', error);
    return { id: `error_conv_${Date.now()}` };
  }
}

export function initIntercom(_userId: string, _email: string, _name: string) {
  // Logic for initializing Intercom client-side if needed
  // This is a placeholder for requirements in components
}

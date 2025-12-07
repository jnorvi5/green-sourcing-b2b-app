// Reusable RFQ email templates (HTML strings)
// Brand: teal #14b8a6, dark bg #0a0a0a

const baseStyles = {
  bodyBg: '#0a0a0a',
  cardBg: '#111827',
  text: '#f8fafc',
  muted: '#cbd5e1',
  buttonBg: '#14b8a6',
  buttonText: '#0b1120',
};

function renderShell({ title, body }: { title: string; body: string }): string {
  return `
  <div style="background:${baseStyles.bodyBg};padding:24px;font-family:Arial,Helvetica,sans-serif;color:${baseStyles.text};">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:640px;margin:0 auto;background:${baseStyles.cardBg};border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:24px 24px 12px 24px;">
          <h2 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;color:${baseStyles.text};">${title}</h2>
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 24px 24px;">
          ${body}
        </td>
      </tr>
    </table>
    <div style="text-align:center;margin-top:12px;color:${baseStyles.muted};font-size:12px;">GreenChainz · Verified Sustainable Supply</div>
  </div>
  <style>
    @media (max-width: 480px) {
      h2 { font-size: 18px !important; }
      .cta { width: 100% !important; display: block !important; }
    }
  </style>
  `;
}

function ctaButton(text: string, href: string): string {
  return `<a class="cta" href="${href}" style="display:inline-block;padding:12px 18px;background:${baseStyles.buttonBg};color:${baseStyles.buttonText};text-decoration:none;border-radius:8px;font-weight:700;">${text}</a>`;
}

function row(label: string, value: string | undefined | null): string {
  if (!value) return '';
  return `<p style="margin:6px 0;color:${baseStyles.muted};"><strong style="color:${baseStyles.text};">${label}:</strong> ${value}</p>`;
}

export function rfqMatchEmail(
  supplierName: string,
  rfqDetails: { project?: string; category?: string; deadline?: string },
  rfqUrl: string
): string {
  const body = `
    <p style="margin:0 0 12px 0;">Hi ${supplierName || 'there'},</p>
    <p style="margin:0 0 12px 0;">You have been matched to a new RFQ. Review details and submit your quote.</p>
    ${row('Project', rfqDetails.project)}
    ${row('Category', rfqDetails.category)}
    ${row('Deadline', rfqDetails.deadline)}
    <div style="margin:18px 0;">${ctaButton('View RFQ & Submit Quote', rfqUrl)}</div>
    <p style="margin:0;color:${baseStyles.muted};font-size:13px;">Respond early to increase your win rate.</p>
  `;
  return renderShell({ title: 'New RFQ Match', body });
}

export function newQuoteEmail(
  architectName: string,
  rfqName: string,
  supplierName: string,
  quoteUrl: string
): string {
  const body = `
    <p style="margin:0 0 12px 0;">Hi ${architectName || 'there'},</p>
    <p style="margin:0 0 12px 0;">${supplierName || 'A supplier'} has submitted a quote for <strong>${rfqName}</strong>.</p>
    <p style="margin:0 0 12px 0;">Preview highlights and compare quotes to keep your project on track.</p>
    <div style="margin:18px 0;">${ctaButton('View & Compare Quotes', quoteUrl)}</div>
    <p style="margin:0;color:${baseStyles.muted};font-size:13px;">Tip: shortlist and message suppliers directly from your RFQ.</p>
  `;
  return renderShell({ title: 'You received a new quote', body });
}

export function quoteAcceptedEmail(
  supplierName: string,
  rfqName: string,
  architectContact: { name?: string; email?: string; phone?: string }
): string {
  const body = `
    <p style="margin:0 0 12px 0;">Hi ${supplierName || 'there'},</p>
    <p style="margin:0 0 12px 0;">Congrats! Your quote for <strong>${rfqName}</strong> was accepted.</p>
    <p style="margin:0 0 12px 0;">Next steps: connect with the architect and finalize terms.</p>
    ${row('Architect', architectContact.name)}
    ${row('Email', architectContact.email)}
    ${row('Phone', architectContact.phone)}
    <p style="margin:12px 0 0 0;color:${baseStyles.muted};font-size:13px;">Keep communication inside GreenChainz for faster responses.</p>
  `;
  return renderShell({ title: 'Quote accepted – next steps', body });
}

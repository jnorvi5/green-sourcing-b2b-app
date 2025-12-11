import { Resend } from 'resend';

type EmailAddress = string;

type SendResponse = Awaited<ReturnType<Resend['emails']['send']>>;

type ScheduleParams = {
  to: EmailAddress;
  subject: string;
  html: string;
  sendAt: string | Date;
};

type SendParams = {
  to: EmailAddress;
  subject: string;
  html: string;
};

type BulkParams = {
  recipients: EmailAddress[];
  subject: string;
  html: string;
};

const FROM = 'GreenChainz <noreply@greenchainz.com>';

function getClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  return new Resend(key);
}

export async function sendEmail({ to, subject, html }: SendParams): Promise<SendResponse> {
  try {
    const resend = getClient();
    return await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('Resend sendEmail error:', err);
    throw err;
  }
}

export async function sendBulkEmail({ recipients, subject, html }: BulkParams): Promise<SendResponse[]> {
  const resend = getClient();
  const outputs: SendResponse[] = [];
  // Resend batch API is limited; fall back to loop
  for (const to of recipients) {
    try {
      const res = await resend.emails.send({ from: FROM, to, subject, html });
      outputs.push(res);
    } catch (err) {
      console.error('Resend sendBulkEmail error:', { to, err });
      throw err;
    }
  }
  return outputs;
}

export async function scheduleEmail({ to, subject, html, sendAt }: ScheduleParams): Promise<SendResponse> {
  try {
    const resend = getClient();
    const scheduledAt = sendAt instanceof Date ? sendAt.toISOString() : sendAt;
    return await resend.emails.send({ from: FROM, to, subject, html, scheduledAt } as any);
  } catch (err) {
    console.error('Resend scheduleEmail error:', err);
    throw err;
  }
}

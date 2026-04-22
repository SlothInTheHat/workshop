import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';

export async function sendWorkshopInvite({
	toEmail,
	toName,
	workshopTitle,
	facilitatorName,
	joinLink,
	role
}: {
	toEmail: string;
	toName: string;
	workshopTitle: string;
	facilitatorName: string;
	joinLink: string;
	role: string;
}) {
	const apiKey = RESEND_API_KEY;
	if (!apiKey) {
		console.log('[EMAIL] RESEND_API_KEY not configured, skipping invite to', toEmail);
		return;
	}

	const resend = new Resend(apiKey);

	await resend.emails.send({
		from: 'onboarding@resend.dev',
		to: toEmail,
		subject: `You've been invited to "${workshopTitle}"`,
		html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 8px;">
          You've been invited to a workshop
        </h1>
        <p style="color: #666; font-size: 16px; margin-bottom: 32px;">
          ${facilitatorName} has invited you to join
          <strong>${workshopTitle}</strong> as a ${role}.
        </p>
        <p style="color: #444; font-size: 15px; margin-bottom: 24px;">
          Before the workshop, please complete your
          pre-work by clicking the link below. It
          should take about 10-15 minutes.
        </p>
        <a href="${joinLink}"
           style="display: inline-block; background: #6B9695; color: white;
                  padding: 14px 28px; border-radius: 8px; text-decoration: none;
                  font-size: 15px; font-weight: 500;">
          Join Workshop →
        </a>
        <p style="color: #999; font-size: 13px; margin-top: 32px;">
          Or copy this link: ${joinLink}
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
        <p style="color: #bbb; font-size: 12px;">
          Powered by Optura AI
        </p>
      </div>
    `
	});
}

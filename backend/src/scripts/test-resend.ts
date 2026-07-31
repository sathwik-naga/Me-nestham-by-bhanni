import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const apiKey = process.env.RESEND_API_KEY || process.argv[2];

if (!apiKey || apiKey.includes('•') || apiKey.includes('your_api_key')) {
  console.error('\n❌ RESEND_API_KEY is missing or invalid.');
  console.log('\nPlease set RESEND_API_KEY in backend/.env or pass it as an argument:');
  console.log('  npx ts-node src/scripts/test-resend.ts re_your_actual_api_key\n');
  process.exit(1);
}

const resend = new Resend(apiKey);

async function sendTestEmail() {
  console.log('Sending email to funnycolours123@gmail.com...');
  try {
    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: 'funnycolours123@gmail.com',
      subject: 'Hello World',
      html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
    });

    if (response.error) {
      console.error('❌ Resend API Error:', response.error.message);
    } else {
      console.log('✅ Email sent successfully! Message ID:', response.data?.id);
    }
  } catch (error: any) {
    console.error('❌ Failed to send email:', error?.message || error);
  }
}

sendTestEmail();

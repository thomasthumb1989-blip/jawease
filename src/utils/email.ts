import { Config } from '@/src/constants/config';

interface AddContactParams {
  email: string;
  firstName?: string;
}

export async function addEmailToAudience({
  email,
  firstName,
}: AddContactParams): Promise<boolean> {
  const { apiKey, audienceId } = Config.resend;
  if (!apiKey || !audienceId) return false;

  try {
    const response = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          first_name: firstName ?? '',
          unsubscribed: false,
        }),
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

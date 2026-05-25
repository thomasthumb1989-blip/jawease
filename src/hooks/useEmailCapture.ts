import { useState } from 'react';
import { addEmailToAudience } from '@/src/utils/email';

export function useEmailCapture() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (email: string, firstName?: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const success = await addEmailToAudience({ email, firstName });
      if (success) {
        setSubmitted(true);
      } else {
        setError('Failed to subscribe. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return { submit, submitting, submitted, error };
}

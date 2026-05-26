import { useState, type FormEvent } from 'react';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import { buildContactPayload } from '@/lib/api/contact-api';
import { getContactApiErrorMessage, useSubmitContact } from '../hooks/useContact';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

function validate(values: typeof emptyForm) {
  if (!values.name.trim()) return 'Name is required.';
  if (!values.email.trim()) return 'Email is required.';
  if (!values.email.includes('@')) return 'Enter a valid email address.';
  if (!values.subject.trim()) return 'Subject is required.';
  if (!values.message.trim()) return 'Message is required.';
  return '';
}

export default function PublicContactForm() {
  const [values, setValues] = useState(emptyForm);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const submitMutation = useSubmitContact();

  const update = (field: keyof typeof emptyForm, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFeedback(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate(values);

    if (validation) {
      setFeedback({ type: 'error', message: validation });
      return;
    }

    try {
      await submitMutation.mutateAsync(buildContactPayload(values));
      setValues(emptyForm);
      setFeedback({ type: 'success', message: 'Thanks. Your message has been sent.' });
    } catch (error) {
      setFeedback({ type: 'error', message: getContactApiErrorMessage(error, 'Message could not be sent.') });
    }
  };

  return (
    <Card title="Contact Us" subtitle="Send a question to the MedSphere team">
      <form className="grid gap-3 md:grid-cols-2" onSubmit={submit}>
        <Input label="Name" value={values.name} onChange={(event) => update('name', event.target.value)} />
        <Input label="Email" type="email" value={values.email} onChange={(event) => update('email', event.target.value)} />
        <Input label="Phone" value={values.phone} onChange={(event) => update('phone', event.target.value)} />
        <Input label="Subject" value={values.subject} onChange={(event) => update('subject', event.target.value)} />
        <label className="block space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium text-foreground">Message</span>
          <textarea
            value={values.message}
            onChange={(event) => update('message', event.target.value)}
            className="min-h-28 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        {feedback ? <FeedbackMessage className="md:col-span-2" type={feedback.type} message={feedback.message} /> : null}
        <div className="md:col-span-2">
          <Button type="submit" loading={submitMutation.isPending}>Send Message</Button>
        </div>
      </form>
    </Card>
  );
}

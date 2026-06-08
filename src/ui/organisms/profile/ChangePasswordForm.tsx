import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import PasswordRequirementsList from '@/ui/molecules/PasswordRequirementsList';

interface ChangePasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface ChangePasswordFormProps {
  labels: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    changePassword: string;
  };
  values: ChangePasswordValues;
  errors: Partial<Record<keyof ChangePasswordValues, string>>;
  requirements: string[];
  loading: boolean;
  feedback?: { type: 'success' | 'error'; message: string } | null;
  onChange: (field: keyof ChangePasswordValues, value: string) => void;
  onBlur: (field: keyof ChangePasswordValues) => void;
  onSubmit: () => void;
}

export default function ChangePasswordForm({
  labels,
  values,
  errors,
  requirements,
  loading,
  feedback,
  onChange,
  onBlur,
  onSubmit,
}: ChangePasswordFormProps) {
  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Input
        id="current-password"
        type="password"
        label={labels.currentPassword}
        value={values.currentPassword}
        onChange={(e) => onChange('currentPassword', e.target.value)}
        onBlur={() => onBlur('currentPassword')}
        error={errors.currentPassword}
      />
      <div />
      <Input
        id="new-password"
        type="password"
        label={labels.newPassword}
        value={values.newPassword}
        onChange={(e) => onChange('newPassword', e.target.value)}
        onBlur={() => onBlur('newPassword')}
        error={errors.newPassword}
      />
      <Input
        id="confirm-new-password"
        type="password"
        label={labels.confirmNewPassword}
        value={values.confirmNewPassword}
        onChange={(e) => onChange('confirmNewPassword', e.target.value)}
        onBlur={() => onBlur('confirmNewPassword')}
        error={errors.confirmNewPassword}
      />
      <PasswordRequirementsList className="md:col-span-2" items={requirements} />
      {feedback && <FeedbackMessage className="md:col-span-2" type={feedback.type} message={feedback.message} />}
      <div className="md:col-span-2 flex justify-start">
        <Button loading={loading}>{labels.changePassword}</Button>
      </div>
    </form>
  );
}

import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import SelectField from '@/ui/molecules/SelectField';

interface ProfileFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  avatarFileId: string;
}

interface ProfileDetailsFormProps {
  labels: {
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    selectGender: string;
    genderFemale: string;
    genderMale: string;
    genderOther: string;
    avatarFileId: string;
    saveProfile: string;
  };
  form: ProfileFormValues;
  loading: boolean;
  feedback?: { type: 'success' | 'error'; message: string } | null;
  onChange: (field: keyof ProfileFormValues, value: string) => void;
  onSubmit: () => void;
}

export default function ProfileDetailsForm({
  labels,
  form,
  loading,
  feedback,
  onChange,
  onSubmit,
}: ProfileDetailsFormProps) {
  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Input id="profile-first-name" label={labels.firstName} value={form.firstName} onChange={(e) => onChange('firstName', e.target.value)} />
      <Input id="profile-last-name" label={labels.lastName} value={form.lastName} onChange={(e) => onChange('lastName', e.target.value)} />
      <Input id="profile-phone" label={labels.phone} value={form.phone} onChange={(e) => onChange('phone', e.target.value)} />
      <Input id="profile-date-of-birth" label={labels.dateOfBirth} value={form.dateOfBirth} onChange={(e) => onChange('dateOfBirth', e.target.value)} />
      <SelectField id="profile-gender" label={labels.gender} value={form.gender} onChange={(e) => onChange('gender', e.target.value)}>
        <option value="">{labels.selectGender}</option>
        <option value="female">{labels.genderFemale}</option>
        <option value="male">{labels.genderMale}</option>
        <option value="other">{labels.genderOther}</option>
      </SelectField>
      <Input id="profile-avatar-file-id" label={labels.avatarFileId} value={form.avatarFileId} onChange={(e) => onChange('avatarFileId', e.target.value)} />
      {feedback && <FeedbackMessage className="md:col-span-2" type={feedback.type} message={feedback.message} />}
      <div className="md:col-span-2">
        <Button loading={loading}>{labels.saveProfile}</Button>
      </div>
    </form>
  );
}

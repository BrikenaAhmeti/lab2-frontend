import { ArrowRight, BadgeCheck, Stethoscope } from 'lucide-react';
import Badge from '@/ui/atoms/Badge';
import type { StaffRecord } from '@/lib/api/staff-api';
import {
  getPublicStaffDisplayName,
  getPublicStaffInitials,
  getPublicStaffSubtitle,
  getPublicStaffTags,
  getPublicStaffTitle,
} from '../utils/publicStaffPresentation';

const palette = [
  'from-cobalt-900 via-primary to-teal-500',
  'from-slate-900 via-cobalt-800 to-med-500',
  'from-cobalt-800 via-teal-700 to-success',
  'from-slate-800 via-primary to-cobalt-600',
];

interface PublicDoctorCardProps {
  staff: StaffRecord;
  index?: number;
}

export default function PublicDoctorCard({ staff, index = 0 }: PublicDoctorCardProps) {
  const name = getPublicStaffDisplayName(staff);
  const title = getPublicStaffTitle(staff);
  const subtitle = getPublicStaffSubtitle(staff);
  const tags = getPublicStaffTags(staff);
  const gradient = palette[index % palette.length];
  const footerLabel = staff.employeeCode && staff.employeeCode !== name ? staff.employeeCode : 'Verified staff';

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-panel transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-soft">
      <div className={`relative min-h-40 bg-gradient-to-br ${gradient} p-5 text-white`}>
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/24 to-transparent" />
        <div className="relative flex items-start justify-between gap-4">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-lg border border-white/24 bg-white/16 text-xl font-semibold backdrop-blur">
            {getPublicStaffInitials(staff)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/14 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Public profile
          </span>
        </div>
        <div className="relative mt-7">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-white/74">
            <Stethoscope className="h-4 w-4" aria-hidden="true" />
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-normal text-white">{name}</h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm font-medium text-primary">{subtitle}</p>
        {staff.bio ? <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted">{staff.bio}</p> : null}

        {tags.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="neutral">{tag}</Badge>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-4 pt-6 text-sm">
          <span className="font-medium text-muted">{footerLabel}</span>
          <a href={`/doctors?staffId=${staff.id}`} className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary/80">
            View profile
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}

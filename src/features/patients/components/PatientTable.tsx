import { memo } from 'react';
import { Link } from 'react-router-dom';
import Badge from '@/ui/atoms/Badge';
import type { PatientRecord } from '@/lib/api/patients-api';
import { getPatientName } from '@/features/patients/hooks/usePatients';
import { formatBloodType, formatDate, formatEnum } from './patientFormat';

function PatientTable({ rows, basePath }: { rows: PatientRecord[]; basePath: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Patient</th>
            <th className="px-4 py-3 font-medium">Personal number</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">Gender</th>
            <th className="px-4 py-3 font-medium">Blood</th>
            <th className="px-4 py-3 font-medium">Born</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Profile</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((patient) => (
            <tr key={patient.id} className="border-t border-border">
              <td className="px-4 py-3 font-medium text-foreground">{getPatientName(patient)}</td>
              <td className="px-4 py-3 font-medium text-foreground">{patient.personalNumber ?? '-'}</td>
              <td className="px-4 py-3 text-muted">
                <p>{patient.email ?? '-'}</p>
                <p>{patient.phone ?? '-'}</p>
              </td>
              <td className="px-4 py-3 text-muted">{formatEnum(patient.gender)}</td>
              <td className="px-4 py-3 text-muted">{formatBloodType(patient.bloodType)}</td>
              <td className="px-4 py-3 text-muted">{formatDate(patient.dateOfBirth)}</td>
              <td className="px-4 py-3">
                <Badge variant={patient.isActive ? 'success' : 'neutral'}>{patient.isActive ? 'Active' : 'Inactive'}</Badge>
              </td>
              <td className="px-4 py-3">
                <Link to={`${basePath}/${patient.id}`} className="font-medium text-primary hover:underline">
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default memo(PatientTable);

interface ImportFileStepProps {
  fileId: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export default function ImportFileStep({ fileId, file, onFileChange }: ImportFileStepProps) {
  return (
    <section className="rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground">Upload File</h3>
      <label htmlFor={fileId} className="mt-3 block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Upload file</span>
        <input
          id={fileId}
          type="file"
          accept=".csv,.xlsx,.json,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
        />
      </label>
      {file ? <p className="mt-2 text-sm text-muted">{file.name}</p> : null}
    </section>
  );
}

import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';

export interface SearchFilterOption {
  value: string;
  label: string;
}

export interface SearchFilterField {
  name: string;
  label: string;
  type?: 'text' | 'select' | 'date' | 'number';
  placeholder?: string;
  options?: SearchFilterOption[];
  min?: number;
  max?: number;
}

interface SearchFilterBarProps {
  q: string;
  filters: Record<string, string>;
  fields: SearchFilterField[];
  searchPlaceholder: string;
  loading?: boolean;
  hasActiveFilters?: boolean;
  onSearchChange: (value: string) => void;
  onFilterChange: (name: string, value: string) => void;
  onClear: () => void;
}

function SelectFilter({
  field,
  value,
  onChange,
}: {
  field: SearchFilterField;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={`filter-${field.name}`} className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{field.label}</span>
      <select
        id={`filter-${field.name}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        <option value="">{field.placeholder ?? `All ${field.label.toLowerCase()}`}</option>
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function SearchFilterBar({
  q,
  filters,
  fields,
  searchPlaceholder,
  loading,
  hasActiveFilters,
  onSearchChange,
  onFilterChange,
  onClear,
}: SearchFilterBarProps) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-surface/50 p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <Input
          id="advanced-search-q"
          label="Search"
          value={q}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
        />
        <div className="flex items-end gap-2">
          {loading ? (
            <span className="mb-2.5 inline-flex items-center gap-2 text-sm text-muted">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading
            </span>
          ) : null}
          {hasActiveFilters ? (
            <Button type="button" variant="secondary" onClick={onClear}>
              Clear Filters
            </Button>
          ) : null}
        </div>
      </div>

      {fields.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {fields.map((field) =>
            field.type === 'select' ? (
              <SelectFilter
                key={field.name}
                field={field}
                value={filters[field.name] ?? ''}
                onChange={(value) => onFilterChange(field.name, value)}
              />
            ) : (
              <Input
                key={field.name}
                id={`filter-${field.name}`}
                label={field.label}
                type={field.type ?? 'text'}
                min={field.min}
                max={field.max}
                value={filters[field.name] ?? ''}
                onChange={(event) => onFilterChange(field.name, event.target.value)}
                placeholder={field.placeholder}
              />
            )
          )}
        </div>
      ) : null}
    </section>
  );
}

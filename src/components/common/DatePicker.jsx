import { Input } from './Input';

/**
 * Calendar date input. Value and onChange use "yyyy-MM-dd" date keys, the same
 * timezone-independent format stored in Firestore.
 */
export function DatePicker({ value, onChange, min, max, ...props }) {
  return (
    <Input
      type="date"
      value={value ?? ''}
      min={min}
      max={max}
      onChange={(event) => onChange(event.target.value)}
      inputClassName="tabular"
      {...props}
    />
  );
}

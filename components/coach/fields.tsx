type Base = {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
  className?: string;
};

function Hint({ text }: { text?: string }) {
  return text ? <span className="mt-1 block text-xs text-slate">{text}</span> : null;
}

export function Field({
  label,
  name,
  hint,
  required,
  className,
  type = "text",
  defaultValue,
  ...rest
}: Base & {
  type?: string;
  defaultValue?: string | number;
  min?: string | number;
  max?: string | number;
  step?: string;
  maxLength?: number;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="field-label">
        {label}
        {required && <span className="text-gold"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="field-input"
        {...rest}
      />
      <Hint text={hint} />
    </label>
  );
}

export function TextArea({
  label,
  name,
  hint,
  required,
  className,
  defaultValue,
  rows = 4,
  maxLength = 5000,
}: Base & { defaultValue?: string; rows?: number; maxLength?: number }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="field-label">
        {label}
        {required && <span className="text-gold"> *</span>}
      </span>
      <textarea
        name={name}
        rows={rows}
        required={required}
        maxLength={maxLength}
        defaultValue={defaultValue}
        className="field-input"
      />
      <Hint text={hint} />
    </label>
  );
}

export function Select({
  label,
  name,
  hint,
  required,
  className,
  defaultValue,
  options,
  placeholder,
}: Base & {
  defaultValue?: string;
  options: (string | { value: string; label: string })[];
  placeholder?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="field-label">
        {label}
        {required && <span className="text-gold"> *</span>}
      </span>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="field-input"
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const text = typeof option === "string" ? option : option.label;

          return (
            <option
              key={value}
              value={value}
            >
              {text}
            </option>
          );
        })}
      </select>
      <Hint text={hint} />
    </label>
  );
}

export function Checkbox({
  label,
  name,
  defaultChecked,
  value = "on",
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  value?: string;
}) {
  return (
    <label className="flex items-start gap-3 text-sm text-cream">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 accent-[#d4af6b]"
      />
      <span>{label}</span>
    </label>
  );
}

export function Hidden({ name, value }: { name: string; value: string }) {
  return (
    <input
      type="hidden"
      name={name}
      value={value}
    />
  );
}

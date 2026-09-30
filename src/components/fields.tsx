'use client';
import { useId } from 'react';

type Common = { label: string; hint?: string; error?: string; required?: boolean };

export function Text({ label, hint, error, required, value, onChange, onBlur, type = 'text', inputMode, autoComplete, id, placeholder, maxLength }: Common & { value?: string; onChange: (v: string) => void; onBlur?: () => void; type?: string; inputMode?: any; autoComplete?: string; id: string; placeholder?: string; maxLength?: number }) {
  return (
    <div className={'field' + (error ? ' invalid' : '')} data-field={id}>
      <label htmlFor={id}>{label}{required && <span className="req" aria-hidden> *</span>}</label>
      {hint && <div className="hint" id={id + '-h'}>{hint}</div>}
      <input id={id} type={type} inputMode={inputMode} autoComplete={autoComplete} placeholder={placeholder} maxLength={maxLength} value={value ?? ''} aria-invalid={!!error} aria-required={required} aria-describedby={[hint ? id + '-h' : '', error ? id + '-e' : ''].join(' ').trim() || undefined} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
      {error && <div className="error" id={id + '-e'} role="alert"><span aria-hidden>⚠</span>{error}</div>}
    </div>
  );
}

export function Area({ label, hint, error, required, value, onChange, onBlur, id, max = 1500, rows }: Common & { value?: string; onChange: (v: string) => void; onBlur?: () => void; id: string; max?: number; rows?: number }) {
  return (
    <div className={'field' + (error ? ' invalid' : '')} data-field={id}>
      <label htmlFor={id}>{label}{required && <span className="req" aria-hidden> *</span>}</label>
      {hint && <div className="hint" id={id + '-h'}>{hint}</div>}
      <textarea id={id} rows={rows} maxLength={max} value={value ?? ''} aria-invalid={!!error} aria-required={required} aria-describedby={[hint ? id + '-h' : '', error ? id + '-e' : ''].join(' ').trim() || undefined} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
      <div className="count" aria-hidden>{(value ?? '').length}/{max}</div>
      {error && <div className="error" id={id + '-e'} role="alert"><span aria-hidden>⚠</span>{error}</div>}
    </div>
  );
}

export function Select({ label, hint, error, required, value, onChange, options, id, placeholder = 'Choose…' }: Common & { value?: string; onChange: (v: string) => void; options: readonly (readonly [string, string])[]; id: string; placeholder?: string }) {
  return (
    <div className={'field' + (error ? ' invalid' : '')} data-field={id}>
      <label htmlFor={id}>{label}{required && <span className="req" aria-hidden> *</span>}</label>
      {hint && <div className="hint">{hint}</div>}
      <select id={id} value={value ?? ''} aria-invalid={!!error} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>{placeholder}</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {error && <div className="error" role="alert"><span aria-hidden>⚠</span>{error}</div>}
    </div>
  );
}

export function Radios({ label, hint, error, required, value, onChange, options, id, two }: Common & { value?: string; onChange: (v: string) => void; options: readonly (readonly [string, string])[]; id: string; two?: boolean }) {
  const name = useId();
  return (
    <fieldset className={error ? 'invalid' : ''} data-field={id} aria-describedby={error ? id + '-e' : undefined}>
      <legend className="lab">{label}{required && <span className="req" aria-hidden> *</span>}</legend>
      {hint && <div className="hint">{hint}</div>}
      <div className={'opts' + (two ? ' two' : '')}>
        {options.map(([v, l], i) => (
          <label className="opt" key={v}>
            <input type="radio" name={name} value={v} checked={value === v} id={i === 0 ? id : undefined} onChange={() => onChange(v)} />
            <span className="mk" aria-hidden /><span>{l}</span>
          </label>
        ))}
      </div>
      {error && <div className="error" id={id + '-e'} role="alert"><span aria-hidden>⚠</span>{error}</div>}
    </fieldset>
  );
}

export function Checks({ label, hint, error, required, value = [], onChange, options, id }: Common & { value?: string[]; onChange: (v: string[]) => void; options: readonly (readonly [string, string])[]; id: string }) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <fieldset className={error ? 'invalid' : ''} data-field={id}>
      <legend className="lab">{label}{required && <span className="req" aria-hidden> *</span>}</legend>
      {hint && <div className="hint">{hint}</div>}
      <div className="opts two">
        {options.map(([v, l], i) => (
          <label className="opt cb" key={v}>
            <input type="checkbox" checked={value.includes(v)} id={i === 0 ? id : undefined} onChange={() => toggle(v)} />
            <span className="mk" aria-hidden /><span>{l}</span>
          </label>
        ))}
      </div>
      {error && <div className="error" role="alert"><span aria-hidden>⚠</span>{error}</div>}
    </fieldset>
  );
}

export function Check({ children, checked, onChange, error, id }: { children: React.ReactNode; checked?: boolean; onChange: (v: boolean) => void; error?: string; id: string }) {
  return (
    <div className={'field' + (error ? ' invalid' : '')} data-field={id}>
      <label className="opt cb">
        <input type="checkbox" id={id} checked={!!checked} aria-invalid={!!error} onChange={(e) => onChange(e.target.checked)} />
        <span className="mk" aria-hidden /><span>{children}</span>
      </label>
      {error && <div className="error" role="alert"><span aria-hidden>⚠</span>{error}</div>}
    </div>
  );
}

// src/shared/ui/Input.tsx
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, ...rest }: InputProps) => {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span>{label}</span>}
      <input
        className={`rounded-lg border bg-[#020617] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors
        border-[var(--border-subtle)] focus:border-[var(--accent)]
        placeholder:text-[var(--text-secondary)]
        ${error ? "border-red-500" : ""}`}
        {...rest}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </label>
  );
};

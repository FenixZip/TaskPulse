// src/shared/ui/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "ghost";
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = ({
  children,
  variant = "primary",
  fullWidth,
  loading,
  disabled,
  ...rest
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  const baseClasses =
    "inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors px-4 py-2 border";
  const variantClasses =
    variant === "primary"
      ? "bg-[var(--accent)] border-[var(--accent)] text-[#020617] hover:bg-[var(--accent-hover)]"
      : "bg-transparent border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[#020617] hover:text-[var(--text-primary)]";

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${widthClass}`}
      disabled={isDisabled}
      {...rest}
    >
      {loading && (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[var(--text-secondary)] border-t-transparent" />
      )}
      {children}
    </button>
  );
};

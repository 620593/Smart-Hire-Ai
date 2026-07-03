import React from "react";

type BadgeVariant = "primary" | "secondary" | "success" | "warning" | "error" | "neutral";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({ children, className = "", variant = "primary", ...props }) => {
  const baseStyle =
    "px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider border select-none";

  const variantStyles: Record<BadgeVariant, string> = {
    primary: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    error: "bg-error/10 text-error border-error/20",
    neutral: "bg-white/5 text-on-surface-variant border-white/10"
  };

  return (
    <span className={`${baseStyle} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};

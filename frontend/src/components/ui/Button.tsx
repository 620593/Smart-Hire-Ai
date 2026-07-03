import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

type ButtonVariant = "primary" | "secondary" | "destructive" | "outline" | "ghost";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "type"> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  type?: "submit" | "button" | "reset";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className = "", variant = "primary", isLoading = false, type = "button", ...props }, ref) => {
    const baseStyle =
      "inline-flex h-10 items-center justify-center rounded-xl px-6 text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 select-none";

    const variantStyles: Record<ButtonVariant, string> = {
      primary: "bg-[#4f46e5] hover:bg-[#4f46e5]/90 text-white shadow-lg shadow-[#4f46e5]/20 hover:shadow-[#60a5fa]/30",
      secondary: "bg-slate-800 hover:bg-slate-700 text-white border border-white/10",
      destructive: "bg-transparent text-error font-semibold border border-error/20 hover:bg-error/10",
      outline: "border border-primary/30 text-primary hover:bg-primary/10",
      ghost: "hover:bg-white/10 text-on-surface-variant hover:text-white"
    };

    return (
      <motion.button
        ref={ref}
        type={type}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`${baseStyle} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

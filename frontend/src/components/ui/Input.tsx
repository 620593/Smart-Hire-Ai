import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface InputProps extends Omit<HTMLMotionProps<"input">, "type"> {
  label?: string;
  error?: string | null;
  type?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, type = "text", className = "", ...props }, ref) => {
    return (
      <div className="space-y-1 w-full text-left">
        {label && (
          <label className="text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant">
            {label}
          </label>
        )}
        <motion.input
          ref={ref}
          type={type}
          whileFocus={{ scale: 1.01, borderColor: "#4f46e5" }}
          className={`flex h-10 w-full rounded-xl border border-white/10 bg-[#1E293B] px-3 py-2 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/50 transition-all disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
          {...props}
        />
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] font-medium text-error"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

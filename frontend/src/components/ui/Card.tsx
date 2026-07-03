import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface CardProps extends HTMLMotionProps<"div"> {
  hoverable?: boolean;
  liquid?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = "", hoverable = false, liquid = true, ...props }, ref) => {
    const cardClass = liquid ? "liquid-glass" : "bg-slate-900/40 border border-white/5";
    return (
      <motion.div
        ref={ref}
        whileHover={hoverable ? { scale: 1.01, translateY: -2 } : undefined}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`${cardClass} rounded-2xl p-6 shadow-xl ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";

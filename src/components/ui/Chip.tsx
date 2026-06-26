import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const chipVariants = cva(
  "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        green: "bg-chip-green text-chip-green-text",
        blue: "bg-chip-blue text-chip-blue-text",
        purple: "bg-chip-purple text-chip-purple-text",
        orange: "bg-chip-orange text-chip-orange-text",
        red: "bg-chip-red text-chip-red-text",
        lime: "bg-lime-muted text-lime-dark",
        muted: "bg-muted text-primary"
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        default: "px-3 py-1 text-xs",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof chipVariants> {
  icon?: React.ReactNode;
}

export function Chip({ className, variant, size, icon, children, ...props }: ChipProps) {
  return (
    <span className={cn(chipVariants({ variant, size }), className)} {...props}>
      {icon}
      {children}
    </span>
  );
}

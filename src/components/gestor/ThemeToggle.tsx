import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGestorTheme } from "@/hooks/gestor/useGestorTheme.tsx";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "pill";
}

export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useGestorTheme();
  const isDark = theme === "dark";

  if (variant === "pill") {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          "relative flex items-center h-8 w-16 rounded-full p-1 transition-colors",
          isDark ? "bg-primary" : "bg-secondary border border-border",
          className
        )}
        aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "absolute flex items-center justify-center w-6 h-6 rounded-full",
            isDark 
              ? "bg-accent text-accent-foreground left-[calc(100%-28px)]" 
              : "bg-card shadow-sm left-1"
          )}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          )}
        </motion.div>
      </button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className={cn("h-9 w-9", className)}
          aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          <motion.div
            initial={false}
            animate={{ rotate: isDark ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isDark ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </motion.div>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isDark ? "Modo claro" : "Modo escuro"}</p>
      </TooltipContent>
    </Tooltip>
  );
}

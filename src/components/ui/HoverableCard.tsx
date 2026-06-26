import { useThemeColors } from '@/hooks/ui/useThemeColors';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface HoverableCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Componente para aplicar estilos de hover harmonizados com o tema
 * Usado para cards e elementos que precisam de hover visual
 */
export function HoverableCard({
  children,
  className,
  onClick,
}: HoverableCardProps) {
  const { surfaceHover, isDark } = useThemeColors();

  const hoverStyle = isDark
    ? {
        '--hover-bg': surfaceHover,
      } as React.CSSProperties & { '--hover-bg': string }
    : {};

  return (
    <div
      className={cn(
        'transition-all duration-200 rounded-md',
        'hover:[background-color:var(--hover-bg)] dark:hover:[background-color:var(--hover-bg)]',
        className,
      )}
      style={hoverStyle}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

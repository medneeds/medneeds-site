import medneedsLogoImg from "@/assets/images/medneeds-logo.png";

interface MedneedsLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function MedneedsLogo({ className = "", showText = true, size = "md" }: MedneedsLogoProps) {
  const iconSizes = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo Icon */}
      <img 
        src={medneedsLogoImg} 
        alt="Medneeds" 
        className={`${iconSizes[size]} w-auto object-contain`}
      />
      
      {/* Brand Text */}
      {showText && (
        <span className={`font-bold ${textSizes[size]}`}>
          <span className="text-primary-foreground">Med</span>
          <span className="text-accent">needs</span>
        </span>
      )}
    </div>
  );
}

// Icon-only version for small spaces
export function MedneedsIcon({ className = "" }: { className?: string }) {
  return (
    <img 
      src={medneedsLogoImg} 
      alt="Medneeds" 
      className={`object-contain ${className}`}
    />
  );
}

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { cn } from "@/lib/utils.ts";

interface UserAvatarProps {
    src?: string | null;
    alt?: string;
    fallback?: string;
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10 text-sm",
    xl: "h-12 w-12 text-base",
};

export function UserAvatar({ src, alt, fallback, className, size = "md" }: UserAvatarProps) {
    return (
        <Avatar className={cn(sizeClasses[size], className)}>
            {src && (
                <AvatarImage
                    src={src}
                    alt={alt}
                    className="object-cover"
                />
            )}
            <AvatarFallback className="bg-secondary text-muted-foreground font-semibold">
                {fallback || "?"}
            </AvatarFallback>
        </Avatar>
    );
}

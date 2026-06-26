import { Link } from "react-router-dom";

interface AuthPortalLinksProps {
    variant: "desktop" | "mobile";
}

export function AuthPortalLinks({ variant }: AuthPortalLinksProps) {
    if (variant === "desktop") {
        return (
            <div className="hidden sm:flex absolute top-4 right-4 items-center gap-3 z-10">
                {/*TODO: Será implementado posteriormente*/}
                {/*<Link*/}
                {/*    to="/gestor/login"*/}
                {/*    className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"*/}
                {/*>*/}
                {/*    Gestão de Escalas*/}
                {/*</Link>*/}
                {/*<span className="text-muted-foreground/30">•</span>*/}
                {/*<Link*/}
                {/*    to="/admin/login"*/}
                {/*    className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"*/}
                {/*>*/}
                {/*    Painel Administrativo*/}
                {/*</Link>*/}
            </div>
        );
    }

    return (
        <div className="flex sm:hidden items-center justify-center gap-4 mt-6 pt-6 border-t border-border">
            {/*TODO: Será implementado posteriormente*/}
            {/*<Link*/}
            {/*    to="/gestor/login"*/}
            {/*    className="text-xs text-muted-foreground hover:text-primary transition-colors"*/}
            {/*>*/}
            {/*    Gestão de Escalas*/}
            {/*</Link>*/}
            {/*<span className="text-muted-foreground/30">•</span>*/}
            {/*<Link*/}
            {/*    to="/admin/login"*/}
            {/*    className="text-xs text-muted-foreground hover:text-primary transition-colors"*/}
            {/*>*/}
            {/*    Admin*/}
            {/*</Link>*/}
        </div>
    );
}

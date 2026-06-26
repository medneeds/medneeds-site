interface AuthTabSwitcherProps {
    activeTab: "login" | "signup" | "token";
    onTabChange: (tab: "login" | "signup" | "token") => void;
}

export function AuthTabSwitcher({ activeTab, onTabChange }: AuthTabSwitcherProps) {
    return (
        <div className="flex gap-2 p-1 bg-muted rounded-xl mb-6">
            <button
                onClick={() => onTabChange("login")}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === "login"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
            >
                Entrar
            </button>
            <button
                onClick={() => onTabChange("signup")}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === "signup"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
            >
                Cadastrar
            </button>
            <button
                onClick={() => onTabChange("token")}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === "token"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
            >
                Usar token
            </button>
        </div>
    );
}

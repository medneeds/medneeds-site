import {useContext} from "react";
import {GestorContext} from "@/contexts/gestor/GestorContext.tsx";

export function useGestorContext() {
    const context = useContext(GestorContext);
    if (context === undefined) {
        throw new Error("useGestorContext must be used within a GestorProvider");
    }
    return context;
}
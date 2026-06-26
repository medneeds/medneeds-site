import { useLoadingStore } from "@/hooks/ui/useLoadingStore.ts";
import { LoadingComponent } from "@/contexts/auth/AuthContext.tsx";

export function GlobalLoading() {
  const isLoading = useLoadingStore((state) => state.isLoading);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <LoadingComponent />
    </div>
  );
}

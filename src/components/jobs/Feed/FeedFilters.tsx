import { Chip } from "@/components/ui/Chip.tsx";
import { cn } from "@/lib/utils.ts";
import { useFiltersStore } from "@/services/filters/store/store.ts";
import { CoreJobFilter } from "@/services/jobs";
import {
    Calendar,
    Check,
    Globe,
    Settings2,
    User
} from "lucide-react";
import { useCallback, useMemo } from "react";

export function FeedFilters() {
    const { filters, activeFilter, setActiveFilter, isLoading } = useFiltersStore();

    const getFilterIcon = useCallback((filterTitle: string, filterId?: string) => {
        const normalize = (value?: string) =>
            (value || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim()
                .toLowerCase();

        const normalizedId = normalize(filterId);

        if (filterTitle === "Para você") {
            return Globe;
        }

        if (normalizedId) {
            if (normalizedId === "available-jobs") return Calendar;
            if (normalizedId === "my-jobs") return User;
        }

        const title = normalize(filterTitle);
        if (title === "ver todas") return Globe;
        if (title === "disponiveis") return Calendar;
        if (title === "suas" || title === "para voce") return User;

        return Settings2;
    }, []);

    const handleFilterSelect = (filter: CoreJobFilter) => {
        setActiveFilter(filter);
    };

    const sortedFilters = useMemo(() => {
        // Garantir que "Ver todas" ou filtros padrão venham primeiro se necessário, 
        // mas o store já cuida da ordenação básica.
        return filters;
    }, [filters]);

    if (isLoading && filters.length === 0) {
        return (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 w-24 bg-muted animate-pulse rounded-full shrink-0" />
                ))}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {sortedFilters.map((filter) => {
                const Icon = getFilterIcon(filter.title, filter.id);
                const filterVariant = (() => {
                    switch (filter.title) {
                        case 'Para você':
                            return 'purple';
                        case 'Disponíveis':
                            return 'blue';
                        case 'Suas':
                            return 'lime';
                    }
                })();
                const isSelected = activeFilter?.id === filter.id;
                return (
                    <Chip
                        key={filter.id || filter.title}
                        variant={!isSelected ? filterVariant : "default"}
                        className={cn(
                            "cursor-pointer shrink-0 transition-all border p-2",
                        )}
                        onClick={() => handleFilterSelect(filter)}
                        icon={isSelected ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                    >
                        {filter.title}
                    </Chip>
                );
            })}
        </div>
    );
}

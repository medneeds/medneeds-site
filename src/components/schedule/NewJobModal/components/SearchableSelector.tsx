import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Search, Check, X, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { SearchableSelectorItem } from "../types.ts";

interface SearchableSelectorProps<T extends SearchableSelectorItem> {
  label: string;
  icon: React.ElementType;
  selected: T | null;
  onSelect: (item: T) => void;
  onClear: () => void;
  searchFn: (query: string) => Promise<T[]>;
  placeholder: string;
  errorMessage?: string;
}

export function SearchableSelector<T extends SearchableSelectorItem>({
  label,
  icon: Icon,
  selected,
  onSelect,
  onClear,
  searchFn,
  placeholder,
  errorMessage,
}: SearchableSelectorProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!isOpen) return;

    // Load initial items
    setLoading(true);
    searchFn("").then((items) => {
      setResults(items);
      setLoading(false);
    });
  }, [isOpen, searchFn]);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const items = await searchFn(value);
      setResults(items);
      setLoading(false);
    }, 300);
  };

  const handleSelect = (item: T) => {
    onSelect(item);
    setIsOpen(false);
    setQuery("");
  };

  if (selected && !isOpen) {
    return (
      <div>
        <Label className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4 text-accent" />
          {label}
        </Label>
        <div className="w-full bg-card rounded-lg border border-accent/50 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-accent" />
            <span className="text-foreground font-medium">{selected.name}</span>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Label className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-accent" />
        {label} *
      </Label>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className={cn(
            "w-full bg-card rounded-lg border p-3 flex items-center justify-between hover:bg-muted/50 transition-colors",
            errorMessage ? "border-red-500" : "border-border",
          )}
        >
          <span className="text-muted-foreground">{placeholder}</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={`Buscar ${label.toLowerCase()}...`}
              className="pl-9 pr-8"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setQuery("");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute top-full left-0 w-full mt-1 border border-border rounded-lg max-h-40 overflow-y-auto bg-card z-50 shadow-lg">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : results.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Nenhum resultado encontrado
              </div>
            ) : (
              results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                >
                  {item.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {errorMessage && (
        <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
      )}
    </div>
  );
}

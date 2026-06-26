import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { cn } from "@/lib/utils.ts";
import { searchService } from "@/services/search/SearchService.ts";
import { Check, ChevronRight, Loader2, MapPin, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PlaceOption } from "../NewJob.types.ts";

interface PlaceSelectorProps {
  selected: PlaceOption | null;
  onSelect: (place: PlaceOption) => void;
  onClear: () => void;
  errorMessage?: string;
}

export function PlaceSelector({
  selected,
  onSelect,
  onClear,
  errorMessage,
}: PlaceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        },
      );
    }
  }, []);

  const fetchPlaces = useCallback(
    async (searchQuery: string) => {
      setLoading(true);
      try {
        const places = await searchService.searchPlaces(
          searchQuery,
          userLocation?.lat,
          userLocation?.lon,
        );
        setResults(Array.isArray(places) ? places : []);
      } catch (error) {
        console.error("Error searching places:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [userLocation],
  );

  // Initial search when opened removed to wait for 3 characters

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length === 0) {
      setResults([]);
      return;
    }

    if (value.length < 3) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchPlaces(value);
    }, 400);
  };

  const handleSelectPlace = async (place: any) => {
    setLoadingDetails(true);
    try {
      let placeData = place;
      // Se já temos cityId da API de busca, não precisamos buscar detalhes extras ou resolver cidade
      if (!place.cityId) {
        const details = await searchService.getPlaceDetails(
          place.id || place.place_id || place.placeId,
        );
        if (details) {
          placeData = { ...place, ...details };
        }
      }

      const placeOption: PlaceOption = {
        placeId: placeData.id || placeData.place_id || placeData.placeId,
        name: placeData.name || "",
        address: placeData.address || placeData.formatted_address || "",
        cityId: placeData.cityId,
        cityName: placeData.cityName,
      };

      onSelect(placeOption);
      setIsOpen(false);
      setQuery("");
    } catch (error) {
      console.error("Error processing place selection:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (selected && !isOpen) {
    return (
      <div>
        <Label className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-foreground" />
          Local *
        </Label>
        <div className="w-full min-h-12 bg-card rounded-xl px-4 py-2 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground font-medium truncate">
                {selected.name}
              </span>
            </div>
            {(selected.address || selected.cityName) && (
              <p className="text-xs text-muted-foreground mt-0.5 ml-6 truncate">
                {selected.address}
                {selected.cityName ? ` - ${selected.cityName}` : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-muted-foreground hover:text-foreground ml-2"
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
        <MapPin className="w-4 h-4 text-foreground" />
        Local *
      </Label>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className={cn(
            "w-full h-12 bg-card rounded-xl border px-4 flex items-center justify-between hover:bg-muted/50 transition-colors",
            errorMessage ? "border-red-500" : "border-border",
          )}
        >
          <span className="text-muted-foreground">Selecione o local</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={
                userLocation
                  ? "Buscar por locais próximos..."
                  : "Buscar por nome ou endereço..."
              }
              className="h-12 pl-9 pr-8 rounded-xl"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setQuery("");
                setResults([]);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="border border-border rounded-lg max-h-48 overflow-y-auto bg-card">
            {loadingDetails ? (
              <div className="flex items-center justify-center py-4 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Carregando detalhes...
                </span>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : query.length < 3 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Digite pelo menos 3 caracteres para buscar
              </div>
            ) : results.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Nenhum local encontrado
              </div>
            ) : (
              results.map((place, idx) => (
                <button
                  key={place.id || place.place_id || place.placeId || idx}
                  type="button"
                  onClick={() => handleSelectPlace(place)}
                  className="w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                >
                  <div className="text-sm font-medium text-foreground">
                    {place.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {place.address || place.formatted_address || ""}
                    {place.city && place.state
                      ? ` - ${place.city}, ${place.state}`
                      : ""}
                  </div>
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

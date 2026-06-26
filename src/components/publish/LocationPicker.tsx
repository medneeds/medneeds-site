import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, Loader2, AlertCircle, ExternalLink, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/ui/useToast.ts";

interface LocationData {
  location: string;
  city: string;
  state: string;
  mapsUrl: string;
  latitude?: number;
  longitude?: number;
}

interface LocationPickerProps {
  value: LocationData;
  onChange: (data: LocationData) => void;
  className?: string;
}

// Hook para gerenciar geolocalização
export function useGeolocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);

  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) return;
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      setPermissionStatus(result.state);
      result.addEventListener("change", () => {
        setPermissionStatus(result.state);
      });
    } catch {
      // Permission API not supported
    }
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada pelo navegador");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition(pos);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Permissão de localização negada.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Localização indisponível.");
            break;
          case err.TIMEOUT:
            setError("Tempo limite excedido.");
            break;
          default:
            setError("Erro ao obter localização.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

  return {
    position,
    error,
    loading,
    permissionStatus,
    requestLocation,
    latitude: position?.coords.latitude,
    longitude: position?.coords.longitude,
  };
}

// Estados brasileiros
const BRAZILIAN_STATES = [
  { uf: "AC", name: "Acre" },
  { uf: "AL", name: "Alagoas" },
  { uf: "AP", name: "Amapá" },
  { uf: "AM", name: "Amazonas" },
  { uf: "BA", name: "Bahia" },
  { uf: "CE", name: "Ceará" },
  { uf: "DF", name: "Distrito Federal" },
  { uf: "ES", name: "Espírito Santo" },
  { uf: "GO", name: "Goiás" },
  { uf: "MA", name: "Maranhão" },
  { uf: "MT", name: "Mato Grosso" },
  { uf: "MS", name: "Mato Grosso do Sul" },
  { uf: "MG", name: "Minas Gerais" },
  { uf: "PA", name: "Pará" },
  { uf: "PB", name: "Paraíba" },
  { uf: "PR", name: "Paraná" },
  { uf: "PE", name: "Pernambuco" },
  { uf: "PI", name: "Piauí" },
  { uf: "RJ", name: "Rio de Janeiro" },
  { uf: "RN", name: "Rio Grande do Norte" },
  { uf: "RS", name: "Rio Grande do Sul" },
  { uf: "RO", name: "Rondônia" },
  { uf: "RR", name: "Roraima" },
  { uf: "SC", name: "Santa Catarina" },
  { uf: "SP", name: "São Paulo" },
  { uf: "SE", name: "Sergipe" },
  { uf: "TO", name: "Tocantins" },
];

// Principais cidades por estado (lista expandida)
const CITIES_BY_STATE: Record<string, string[]> = {
  AC: ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira", "Tarauacá", "Feijó", "Brasiléia", "Senador Guiomard"],
  AL: ["Maceió", "Arapiraca", "Rio Largo", "Palmeira dos Índios", "União dos Palmares", "Penedo", "São Miguel dos Campos"],
  AP: ["Macapá", "Santana", "Laranjal do Jari", "Oiapoque", "Mazagão", "Porto Grande", "Tartarugalzinho"],
  AM: ["Manaus", "Parintins", "Itacoatiara", "Manacapuru", "Coari", "Tefé", "Tabatinga", "Maués"],
  BA: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Juazeiro", "Itabuna", "Lauro de Freitas", "Ilhéus", "Jequié", "Teixeira de Freitas", "Barreiras", "Alagoinhas", "Porto Seguro", "Simões Filho", "Paulo Afonso"],
  CE: ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú", "Sobral", "Crato", "Itapipoca", "Maranguape", "Iguatu", "Quixadá"],
  DF: ["Brasília", "Ceilândia", "Taguatinga", "Samambaia", "Plano Piloto", "Águas Claras", "Gama", "Sobradinho"],
  ES: ["Vitória", "Vila Velha", "Serra", "Cariacica", "Cachoeiro de Itapemirim", "Linhares", "São Mateus", "Colatina", "Guarapari"],
  GO: ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde", "Luziânia", "Águas Lindas de Goiás", "Valparaíso de Goiás", "Trindade", "Formosa", "Novo Gama", "Senador Canedo", "Catalão", "Itumbiara", "Jataí"],
  MA: ["São Luís", "Imperatriz", "São José de Ribamar", "Timon", "Caxias", "Codó", "Paço do Lumiar", "Açailândia", "Bacabal", "Balsas", "Santa Inês", "Barra do Corda", "Pinheiro", "Chapadinha"],
  MT: ["Cuiabá", "Várzea Grande", "Rondonópolis", "Sinop", "Tangará da Serra", "Cáceres", "Sorriso", "Lucas do Rio Verde", "Primavera do Leste", "Barra do Garças"],
  MS: ["Campo Grande", "Dourados", "Três Lagoas", "Corumbá", "Ponta Porã", "Naviraí", "Nova Andradina", "Aquidauana", "Sidrolândia", "Paranaíba"],
  MG: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros", "Ribeirão das Neves", "Uberaba", "Governador Valadares", "Ipatinga", "Sete Lagoas", "Divinópolis", "Santa Luzia", "Ibirité", "Poços de Caldas", "Patos de Minas", "Pouso Alegre", "Teófilo Otoni", "Barbacena", "Sabará", "Varginha", "Conselheiro Lafaiete", "Araguari", "Itabira"],
  PA: ["Belém", "Ananindeua", "Santarém", "Marabá", "Parauapebas", "Castanhal", "Abaetetuba", "Cametá", "Marituba", "Bragança", "Altamira", "Barcarena", "Tucuruí"],
  PB: ["João Pessoa", "Campina Grande", "Santa Rita", "Patos", "Bayeux", "Sousa", "Cajazeiras", "Cabedelo", "Guarabira", "Sapé"],
  PR: ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel", "São José dos Pinhais", "Foz do Iguaçu", "Colombo", "Guarapuava", "Paranaguá", "Araucária", "Toledo", "Apucarana", "Pinhais", "Campo Largo", "Almirante Tamandaré", "Umuarama", "Paranavaí", "Francisco Beltrão", "Fazenda Rio Grande"],
  PE: ["Recife", "Jaboatão dos Guararapes", "Olinda", "Caruaru", "Petrolina", "Paulista", "Cabo de Santo Agostinho", "Camaragibe", "Garanhuns", "Vitória de Santo Antão", "Igarassu", "São Lourenço da Mata", "Abreu e Lima", "Serra Talhada"],
  PI: ["Teresina", "Parnaíba", "Picos", "Piripiri", "Floriano", "Campo Maior", "Barras", "União", "Altos", "Pedro II"],
  RJ: ["Rio de Janeiro", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Niterói", "Belford Roxo", "São João de Meriti", "Campos dos Goytacazes", "Petrópolis", "Volta Redonda", "Magé", "Macaé", "Itaboraí", "Mesquita", "Nova Friburgo", "Barra Mansa", "Nilópolis", "Teresópolis", "Angra dos Reis", "Cabo Frio", "Maricá", "Queimados"],
  RN: ["Natal", "Mossoró", "Parnamirim", "São Gonçalo do Amarante", "Macaíba", "Ceará-Mirim", "Caicó", "Açu", "Currais Novos", "São José de Mipibu"],
  RS: ["Porto Alegre", "Caxias do Sul", "Canoas", "Pelotas", "Santa Maria", "Gravataí", "Viamão", "Novo Hamburgo", "São Leopoldo", "Rio Grande", "Alvorada", "Passo Fundo", "Sapucaia do Sul", "Uruguaiana", "Santa Cruz do Sul", "Cachoeirinha", "Bagé", "Bento Gonçalves", "Erechim", "Guaíba", "Lajeado", "Ijuí"],
  RO: ["Porto Velho", "Ji-Paraná", "Ariquemes", "Vilhena", "Cacoal", "Rolim de Moura", "Jaru", "Guajará-Mirim", "Ouro Preto do Oeste"],
  RR: ["Boa Vista", "Rorainópolis", "Caracaraí", "Alto Alegre", "Mucajaí", "Cantá", "Pacaraima", "Bonfim"],
  SC: ["Florianópolis", "Joinville", "Blumenau", "São José", "Chapecó", "Criciúma", "Itajaí", "Jaraguá do Sul", "Palhoça", "Lages", "Balneário Camboriú", "Brusque", "Tubarão", "São Bento do Sul", "Caçador", "Concórdia", "Camboriú", "Navegantes", "Rio do Sul", "Araranguá", "Gaspar", "Mafra", "Içara", "Biguaçu"],
  SP: ["São Paulo", "Guarulhos", "Campinas", "São Bernardo do Campo", "Santo André", "Osasco", "Ribeirão Preto", "Sorocaba", "São José dos Campos", "Santos", "São José do Rio Preto", "Mauá", "Mogi das Cruzes", "Diadema", "Jundiaí", "Piracicaba", "Carapicuíba", "Bauru", "Itaquaquecetuba", "São Vicente", "Franca", "Praia Grande", "Guarujá", "Taubaté", "Limeira", "Suzano", "Taboão da Serra", "Sumaré", "Barueri", "Embu das Artes", "São Carlos", "Indaiatuba", "Cotia", "Americana", "Marília", "Itapevi", "Araraquara", "Jacareí", "Presidente Prudente", "Hortolândia", "Rio Claro", "Araçatuba", "Ferraz de Vasconcelos", "Santa Bárbara d'Oeste", "Francisco Morato"],
  SE: ["Aracaju", "Nossa Senhora do Socorro", "Lagarto", "Itabaiana", "São Cristóvão", "Estância", "Tobias Barreto", "Itabaianinha", "Simão Dias", "Capela"],
  TO: ["Palmas", "Araguaína", "Gurupi", "Porto Nacional", "Paraíso do Tocantins", "Colinas do Tocantins", "Guaraí", "Tocantinópolis", "Dianópolis", "Miracema do Tocantins"],
};

// Normalizar texto para busca
const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

export function LocationPicker({ value, onChange, className }: LocationPickerProps) {
  const { toast } = useToast();
  const geo = useGeolocation();
  const [showStateSelect, setShowStateSelect] = useState(false);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  useEffect(() => {
    if (geo.permissionStatus === "granted" && !geo.position && !geo.loading) {
      geo.requestLocation();
    }
  }, [geo.permissionStatus]);

  const handleRequestLocation = () => {
    geo.requestLocation();
    if (geo.permissionStatus === "prompt") {
      toast({
        title: "Permissão de localização",
        description: "Por favor, autorize o acesso à sua localização.",
      });
    }
  };

  const generateMapsUrl = useCallback((query: string) => {
    return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
  }, []);

  const updateMapsUrl = useCallback(() => {
    if (value.location && value.city) {
      const query = `${value.location}, ${value.city}, ${value.state}`;
      onChange({
        ...value,
        mapsUrl: generateMapsUrl(query),
      });
    }
  }, [value, onChange, generateMapsUrl]);

  // Cidades filtradas pelo estado selecionado e busca
  const availableCities = value.state ? (CITIES_BY_STATE[value.state] || []) : [];
  const filteredCities = citySearch
    ? availableCities.filter((city) => normalizeText(city).includes(normalizeText(citySearch)))
    : availableCities;

  const handleSelectCity = (city: string) => {
    onChange({ ...value, city });
    setCitySearch("");
    setShowCitySearch(false);
    setTimeout(updateMapsUrl, 100);
  };

  const handleStateChange = (uf: string) => {
    onChange({ ...value, state: uf, city: "" });
    setShowStateSelect(false);
    setCitySearch("");
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Geolocation */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={geo.position ? "outline" : "default"}
          size="sm"
          onClick={handleRequestLocation}
          disabled={geo.loading}
          className={geo.position ? "border-accent text-accent" : ""}
        >
          {geo.loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4 mr-2" />
          )}
          {geo.position ? "Localização ativa" : "Ativar localização"}
        </Button>
        
        {geo.error && (
          <span className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {geo.error}
          </span>
        )}
      </div>

      {/* Location name */}
      <div className="space-y-2">
        <Label htmlFor="location" className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-accent" />
          Nome do local *
        </Label>
        <Input
          id="location"
          value={value.location}
          onChange={(e) => onChange({ ...value, location: e.target.value })}
          onBlur={updateMapsUrl}
          placeholder="Ex: Hospital São Lucas, Clínica Santa Maria..."
        />
        <p className="text-xs text-muted-foreground">
          Digite o nome do hospital, clínica ou unidade de saúde
        </p>
      </div>

      {/* State first, then City */}
      <div className="grid grid-cols-3 gap-3">
        {/* Estado */}
        <div className="space-y-2">
          <Label>UF *</Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStateSelect(!showStateSelect)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <span className={value.state ? "text-foreground font-medium" : "text-muted-foreground"}>
                {value.state || "UF"}
              </span>
            </button>
            {showStateSelect && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {BRAZILIAN_STATES.map((state) => (
                  <button
                    key={state.uf}
                    type="button"
                    onClick={() => handleStateChange(state.uf)}
                    className={cn(
                      "w-full px-3 py-2 text-left hover:bg-muted transition-colors",
                      value.state === state.uf && "bg-accent text-accent-foreground"
                    )}
                  >
                    <span className="font-medium">{state.uf}</span>
                    <span className="text-muted-foreground ml-2 text-sm">{state.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cidade com busca */}
        <div className="col-span-2 space-y-2">
          <Label>Cidade *</Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => value.state && setShowCitySearch(true)}
              disabled={!value.state}
              className={cn(
                "w-full h-10 px-3 rounded-md border border-input bg-background text-left flex items-center justify-between transition-colors",
                value.state ? "hover:bg-muted/50" : "opacity-50 cursor-not-allowed"
              )}
            >
              <span className={value.city ? "text-foreground" : "text-muted-foreground"}>
                {value.city || (value.state ? "Buscar cidade..." : "Selecione o estado")}
              </span>
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>

            {showCitySearch && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50">
                {/* Search input */}
                <div className="p-2 border-b border-border flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder="Buscar cidade..."
                    className="flex-1 bg-transparent border-0 outline-none text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCitySearch("");
                      setShowCitySearch(false);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* City list */}
                <div className="max-h-48 overflow-y-auto">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleSelectCity(city)}
                        className={cn(
                          "w-full px-3 py-2 text-left hover:bg-muted transition-colors text-sm",
                          value.city === city && "bg-accent text-accent-foreground"
                        )}
                      >
                        {city}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        {citySearch ? "Nenhuma cidade encontrada" : "Digite para buscar"}
                      </p>
                      {citySearch && (
                        <button
                          type="button"
                          onClick={() => handleSelectCity(citySearch)}
                          className="mt-2 text-sm text-accent hover:underline"
                        >
                          Usar "{citySearch}"
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Maps URL */}
      <div className="space-y-2">
        <Label htmlFor="mapsUrl" className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4" />
          Link do Google Maps
        </Label>
        <div className="flex gap-2">
          <Input
            id="mapsUrl"
            value={value.mapsUrl}
            onChange={(e) => onChange({ ...value, mapsUrl: e.target.value })}
            placeholder="https://maps.google.com/..."
            className="flex-1"
          />
          {value.mapsUrl && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => window.open(value.mapsUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Gerado automaticamente ao preencher local e cidade
        </p>
      </div>
    </div>
  );
}

// Mobile version
export function MobileLocationPicker({ value, onChange, className }: LocationPickerProps) {
  const { toast } = useToast();
  const geo = useGeolocation();
  const [showStates, setShowStates] = useState(false);
  const [showCities, setShowCities] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  const handleRequestLocation = () => {
    geo.requestLocation();
    if (geo.permissionStatus === "prompt") {
      toast({
        title: "Localização",
        description: "Autorize o acesso para facilitar o preenchimento.",
      });
    }
  };

  const generateMapsUrl = useCallback((query: string) => {
    return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
  }, []);

  const availableCities = value.state ? (CITIES_BY_STATE[value.state] || []) : [];
  const filteredCities = citySearch
    ? availableCities.filter((city) => normalizeText(city).includes(normalizeText(citySearch)))
    : availableCities;

  const handleSelectCity = (city: string) => {
    onChange({
      ...value,
      city,
      mapsUrl: value.location ? generateMapsUrl(`${value.location}, ${city}, ${value.state}`) : "",
    });
    setCitySearch("");
    setShowCities(false);
  };

  const handleStateChange = (uf: string) => {
    onChange({ ...value, state: uf, city: "" });
    setShowStates(false);
    setCitySearch("");
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Location button */}
      <button
        type="button"
        onClick={handleRequestLocation}
        disabled={geo.loading}
        className={cn(
          "w-full p-3 rounded-xl border flex items-center gap-3 transition-all",
          geo.position
            ? "border-accent bg-lime-muted"
            : "border-border bg-card"
        )}
      >
        {geo.loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <Navigation className={cn("h-5 w-5", geo.position ? "text-accent" : "text-muted-foreground")} />
        )}
        <div className="text-left flex-1">
          <p className={cn("font-medium", geo.position ? "text-accent" : "text-foreground")}>
            {geo.position ? "Localização ativa" : "Ativar localização"}
          </p>
          <p className="text-xs text-muted-foreground">
            {geo.error || (geo.position ? "Facilita a busca de locais" : "Toque para autorizar")}
          </p>
        </div>
      </button>

      {/* Form fields */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Nome do local */}
        <div className="p-3 border-b border-border">
          <Label className="text-xs text-muted-foreground mb-1 block">Nome do local</Label>
          <Input
            value={value.location}
            onChange={(e) => onChange({ ...value, location: e.target.value })}
            placeholder="Hospital, clínica..."
            className="border-0 p-0 h-auto text-base bg-transparent focus-visible:ring-0"
          />
        </div>

        {/* Estado */}
        <button
          type="button"
          onClick={() => setShowStates(true)}
          className="w-full p-3 text-left border-b border-border"
        >
          <Label className="text-xs text-muted-foreground mb-1 block">Estado</Label>
          <p className={value.state ? "text-foreground font-medium" : "text-muted-foreground"}>
            {value.state ? BRAZILIAN_STATES.find(s => s.uf === value.state)?.name || value.state : "Selecione o estado"}
          </p>
        </button>

        {/* Cidade */}
        <button
          type="button"
          onClick={() => value.state && setShowCities(true)}
          disabled={!value.state}
          className={cn(
            "w-full p-3 text-left flex items-center justify-between",
            !value.state && "opacity-50"
          )}
        >
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Cidade</Label>
            <p className={value.city ? "text-foreground" : "text-muted-foreground"}>
              {value.city || (value.state ? "Buscar cidade..." : "Selecione o estado primeiro")}
            </p>
          </div>
          <Search className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* State selector fullscreen */}
      {showStates && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-lg">Selecionar Estado</h2>
            <button onClick={() => setShowStates(false)} className="text-muted-foreground">
              Fechar
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {BRAZILIAN_STATES.map((state) => (
              <button
                key={state.uf}
                onClick={() => handleStateChange(state.uf)}
                className={cn(
                  "w-full px-4 py-4 text-left border-b border-border flex items-center justify-between",
                  value.state === state.uf && "bg-lime-muted"
                )}
              >
                <span>
                  <span className="font-medium">{state.uf}</span>
                  <span className="text-muted-foreground ml-2">{state.name}</span>
                </span>
                {value.state === state.uf && <MapPin className="h-5 w-5 text-accent" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* City selector fullscreen */}
      {showCities && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-lg">Selecionar Cidade</h2>
            <button onClick={() => { setShowCities(false); setCitySearch(""); }} className="text-muted-foreground">
              Fechar
            </button>
          </div>
          
          {/* Search bar */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Buscar cidade..."
                className="flex-1 bg-transparent border-0 outline-none"
                autoFocus
              />
              {citySearch && (
                <button onClick={() => setCitySearch("")}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredCities.length > 0 ? (
              filteredCities.map((city) => (
                <button
                  key={city}
                  onClick={() => handleSelectCity(city)}
                  className={cn(
                    "w-full px-4 py-4 text-left border-b border-border flex items-center justify-between",
                    value.city === city && "bg-lime-muted"
                  )}
                >
                  <span>{city}</span>
                  {value.city === city && <MapPin className="h-5 w-5 text-accent" />}
                </button>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">
                  {citySearch ? "Nenhuma cidade encontrada" : "Digite para buscar"}
                </p>
                {citySearch && (
                  <button
                    onClick={() => handleSelectCity(citySearch)}
                    className="mt-4 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium"
                  >
                    Usar "{citySearch}"
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Maps URL */}
      <div className="bg-card rounded-xl border border-border p-3">
        <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          Link do Google Maps (opcional)
        </Label>
        <Input
          value={value.mapsUrl}
          onChange={(e) => onChange({ ...value, mapsUrl: e.target.value })}
          placeholder="https://maps.google.com/..."
          className="border-0 p-0 h-auto text-sm bg-transparent focus-visible:ring-0"
        />
      </div>
    </div>
  );
}

import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/ui/hooks";

/**
 * Componente para selecionar o tema (padrão/minimal/suave)
 * Pode ser usado em páginas de preferências
 */
export function ThemeSwitcher() {
  const { theme, setTheme, availableThemes } = useTheme();

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="theme-select">Tema</Label>
      <Select value={theme.name} onValueChange={(themeName) => {
        const selectedTheme = availableThemes.find(t => t.name === themeName);
        if (selectedTheme) {
          setTheme(selectedTheme);
        }
      }}>
        <SelectTrigger id="theme-select">
          <SelectValue placeholder="Selecionar tema" />
        </SelectTrigger>
        <SelectContent>
          {availableThemes.map((availableTheme) => (
            <SelectItem key={availableTheme.name} value={availableTheme.name}>
              {availableTheme.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Tema atual: {theme.label}
      </p>
    </div>
  );
}

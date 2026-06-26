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
 * Componente para selecionar a aparência do tema (claro/escuro/sistema)
 * Pode ser usado em páginas de preferências
 */
export function ThemeAppearanceSwitcher() {
  const { appearance, setAppearance, getAppearanceLabel } = useTheme();

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="theme-appearance">Aparência</Label>
      <Select value={appearance} onValueChange={setAppearance}>
        <SelectTrigger id="theme-appearance">
          <SelectValue placeholder="Selecionar aparência" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">🌞 Claro</SelectItem>
          <SelectItem value="dark">🌙 Escuro</SelectItem>
          <SelectItem value="system">🖥️ Sistema</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Atual: {getAppearanceLabel()}
      </p>
    </div>
  );
}

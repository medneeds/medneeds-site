import { LucideIcon, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AuthFormFieldProps<T extends FieldValues> {
    form: UseFormReturn<T>;
    name: Path<T>;
    label: string;
    placeholder: string;
    icon: LucideIcon;
    type?: string;
}

export function AuthFormField<T extends FieldValues>({
    form,
    name,
    label,
    placeholder,
    icon: Icon,
    type = "text",
}: AuthFormFieldProps<T>) {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === "password";

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field, fieldState }) => (
                <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">{label}</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                                type={isPasswordField && showPassword ? "text" : type}
                                placeholder={placeholder}
                                {...field}
                                className={cn(
                                    "pl-11 h-12 bg-card border-0 focus:ring-2 focus:ring-accent",
                                    isPasswordField && "pr-12",
                                    fieldState.error && "border border-destructive"
                                )}
                            />
                            {isPasswordField && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={togglePasswordVisibility}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                    <span className="sr-only">
                                        {showPassword ? "Esconder senha" : "Mostrar senha"}
                                    </span>
                                </Button>
                            )}
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

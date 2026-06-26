import {FormProps, useForm} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Mail, CreditCard, Hash, MapPin, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AuthFormField } from "./AuthFormField";
import { signupSchema, SignupFormValues } from "@/pages/auth/Auth.schema.ts";
import { UF_OPTIONS } from "@/utils/constants.ts";
import {IFormProps} from "@/types/form.types.ts";

export function SignupForm({ loading, onSubmit }: IFormProps<SignupFormValues>) {
    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: "",
            email: "",
            cpf: "",
            password: "",
            confirmPassword: "",
            crmNumber: 0,
            uf: "",
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <AuthFormField
                    form={form}
                    name="name"
                    label="Nome completo"
                    placeholder="Dr. João Silva"
                    icon={User}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <AuthFormField
                        form={form}
                        name="email"
                        label="Email"
                        placeholder="seu@email.com"
                        icon={Mail}
                        type="email"
                    />

                    <AuthFormField
                        form={form}
                        name="cpf"
                        label="CPF"
                        placeholder="000.000.000-00"
                        icon={CreditCard}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <AuthFormField
                        form={form}
                        name="crmNumber"
                        label="CRM (Número)"
                        placeholder="123456"
                        icon={Hash}
                        type="number"
                    />

                    <FormField
                        control={form.control}
                        name="uf"
                        render={({ field, fieldState }) => (
                            <FormItem className="space-y-2">
                                <FormLabel className="text-sm font-medium">Estado (UF)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                                            <SelectTrigger className={cn(
                                                "pl-11 h-12 bg-muted/50 border-0 focus:bg-card focus:ring-2 focus:ring-accent",
                                                fieldState.error && "border border-destructive"
                                            )}>
                                                <SelectValue placeholder="UF" />
                                            </SelectTrigger>
                                        </div>
                                    </FormControl>
                                    <SelectContent>
                                        {UF_OPTIONS.map((uf) => (
                                            <SelectItem key={uf} value={uf}>
                                                {uf}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <AuthFormField
                        form={form}
                        name="password"
                        label="Senha"
                        placeholder="••••••"
                        icon={Lock}
                        type="password"
                    />

                    <AuthFormField
                        form={form}
                        name="confirmPassword"
                        label="Confirmar senha"
                        placeholder="••••••"
                        icon={Lock}
                        type="password"
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold group"
                    disabled={loading}
                >
                    {loading ? (
                        <div className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
                    ) : (
                        <>
                            Criar conta
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>
            </form>
        </Form>
    );
}

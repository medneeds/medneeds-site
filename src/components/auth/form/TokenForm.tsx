import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Key, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Form } from "@/components/ui/form.tsx";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.tsx";
import { AuthFormField } from "../AuthFormField.tsx";
import {TokenFormValues, tokenSchema} from "@/pages/auth/schema/Auth.schema.ts";
import {IFormProps} from "@/types/form.types.ts";

interface TokenFormProps extends IFormProps<TokenFormValues> {
    defaultToken?: string;
    defaultCpf?: string;
    defaultLoginType?: 'personal' | 'institutional';
}

export function TokenForm({ loading, onSubmit, defaultToken = '', defaultCpf = '', defaultLoginType = 'personal' }: TokenFormProps) {
    const form = useForm<TokenFormValues>({
        resolver: zodResolver(tokenSchema),
        defaultValues: {
            token: defaultToken,
            loginType: defaultLoginType,
            cpf: defaultCpf,
        },
    });

    const loginType = useWatch({
        control: form.control,
        name: "loginType",
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="loginType"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-medium">Tipo de acesso</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-12 bg-card border-0 focus:ring-2 focus:ring-accent">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="personal">Pessoal</SelectItem>
                                    <SelectItem value="institutional">Institucional</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <AuthFormField
                    form={form}
                    name="token"
                    label="Token"
                    placeholder="Insira o token"
                    icon={Key}
                />

                {loginType === "institutional" && (
                    <FormField
                        control={form.control}
                        name="cpf"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormLabel className="text-sm font-medium">CPF</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            {...field}
                                            inputMode="numeric"
                                            maxLength={11}
                                            placeholder="Apenas números"
                                            onChange={(event) => {
                                                field.onChange(event.target.value.replace(/\D/g, "").slice(0, 11));
                                            }}
                                            className="h-12 bg-card border-0 focus:ring-2 focus:ring-accent"
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <Button
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold group"
                    disabled={loading}
                >
                    {loading ? (
                        <div className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
                    ) : (
                        <>
                            Enviar
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>
            </form>
        </Form>
    );
}

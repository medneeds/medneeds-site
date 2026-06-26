import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Form } from "@/components/ui/form.tsx";
import { AuthFormField } from "../AuthFormField.tsx";
import { resetPasswordSchema, ResetPasswordFormValues } from "@/pages/auth/schema/Auth.schema.ts";
import { IFormProps } from "@/types/form.types.ts";

export function ResetPasswordForm({ loading, onSubmit }: IFormProps<ResetPasswordFormValues>) {
    const form = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            token: "",
            password: "",
            confirmPassword: "",
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <AuthFormField
                    form={form}
                    name="token"
                    label="Código de Segurança"
                    placeholder="Digite o código enviado"
                    icon={KeyRound}
                />

                <AuthFormField
                    form={form}
                    name="password"
                    label="Nova Senha"
                    placeholder="••••••••"
                    icon={Lock}
                    type="password"
                />

                <AuthFormField
                    form={form}
                    name="confirmPassword"
                    label="Confirmar Nova Senha"
                    placeholder="••••••••"
                    icon={Lock}
                    type="password"
                />

                <Button
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold group"
                    disabled={loading}
                >
                    {loading ? (
                        <div className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
                    ) : (
                        <>
                            Redefinir senha
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>
            </form>
        </Form>
    );
}

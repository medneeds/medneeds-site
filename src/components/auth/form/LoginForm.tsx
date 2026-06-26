import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Form } from "@/components/ui/form.tsx";
import { AuthFormField } from "../AuthFormField.tsx";
import { loginSchema, LoginFormValues } from "@/pages/auth/schema/Auth.schema.ts";
import {IFormProps} from "@/types/form.types.ts";

interface ILoginFormProps extends IFormProps<LoginFormValues>{
    onForgetPassword: () => void;
}

export function LoginForm({ loading, onSubmit, onForgetPassword }: ILoginFormProps) {
    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <AuthFormField
                    form={form}
                    name="email"
                    label="Email"
                    placeholder="seu@email.com"
                    icon={Mail}
                />

                <AuthFormField
                    form={form}
                    name="password"
                    label="Senha"
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
                            Entrar
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>

                <button
                    type="button"
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                    onClick={onForgetPassword}
                >
                    Esqueceu sua senha?
                </button>
            </form>
        </Form>
    );
}

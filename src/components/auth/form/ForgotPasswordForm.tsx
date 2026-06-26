import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Form } from "@/components/ui/form.tsx";
import { AuthFormField } from "../AuthFormField.tsx";
import { forgotPasswordSchema, ForgotPasswordFormValues } from "@/pages/auth/schema/Auth.schema.ts";
import { IFormProps } from "@/types/form.types.ts";

export function ForgotPasswordForm({ loading, onSubmit }: IFormProps<ForgotPasswordFormValues>) {
    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <AuthFormField
                    form={form}
                    name="email"
                    label="E-mail"
                    placeholder="seu@email.com"
                    icon={Mail}
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
                            Enviar link
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>
            </form>
        </Form>
    );
}

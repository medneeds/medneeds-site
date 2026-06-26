import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Key, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { AuthFormField } from "./AuthFormField";
import {TokenFormValues, tokenSchema} from "@/pages/auth/Auth.schema.ts";
import {IFormProps} from "@/types/form.types.ts";

export function TokenForm({ loading, onSubmit }: IFormProps<TokenFormValues>) {
    const form = useForm<TokenFormValues>({
        resolver: zodResolver(tokenSchema),
        defaultValues: {
            token: ''
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <AuthFormField
                    form={form}
                    name="token"
                    label="Token"
                    placeholder="Insira o token"
                    icon={Key}
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
                            Enviar
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>
            </form>
        </Form>
    );
}

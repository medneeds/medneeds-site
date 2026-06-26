import * as z from "zod";

export const loginSchema = z.object({
    email: z.string().email("Email inválido").min(1, "O email é obrigatório"),
    password: z.string().min(1, "A senha é obrigatória"),
});

export const signupSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres").max(999),
    email: z.string().email("Email inválido").min(1, "O email é obrigatório").max(999),
    cpf: z.string().min(11, "CPF inválido").max(14, "CPF inválido"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(1, "A confirmação de senha é obrigatória"),
    crmNumber: z.coerce.number().min(1, "Número do CRM é obrigatório"),
    uf: z.string().min(2, "UF é obrigatória").max(2, "UF inválida"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
});

export const tokenSchema = z.object({
    token: z.string().min(1).max(999),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email("Email inválido").min(1, "O email é obrigatório"),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "O código é obrigatório"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(1, "A confirmação de senha é obrigatória"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type TokenFormValues = z.infer<typeof tokenSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

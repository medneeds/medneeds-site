import z from "zod";

export const newJobSchema = z.object({
    modality: z.object(
        { id: z.string(), name: z.string() },
        { required_error: "Selecione a modalidade" }
    ),
    clinicalArea: z.object(
        { id: z.string(), name: z.string() },
        { required_error: "Selecione a atuação" }
    ),
    place: z.object(
        {
            placeId: z.string(),
            name: z.string(),
            address: z.string(),
            cityId: z.string().optional(),
            cityName: z.string().optional(),
        },
        { required_error: "Selecione o local" }
    ),
    startDate: z.date(),
    startTime: z.string().min(1, "Selecione o horário de início"),
    duration: z.number().min(1),
    price: z.string().refine((val) => {
        const numbers = val.replace(/\D/g, "");
        const amount = parseInt(numbers || "0", 10) / 100;
        return amount <= 99999;
    }, { message: "O valor não pode passar de R$ 99.999,00" }),
    paymentMethod: z.enum(["AV", "NR", "AC"]),
    singlePaymentForMultipleDates: z.boolean().nullable(),
    visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]),
    enableReplication: z.boolean(),
    replicateDates: z.array(z.date()),
});

export type NewJobFormData = z.infer<typeof newJobSchema>;
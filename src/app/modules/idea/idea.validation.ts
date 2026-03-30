import { IdeaStatus } from "../../../generated/prisma/client";
import z from "zod";

export const createIdeaSchema = z.object({
    body: z.object({
        title: z.string().min(5, "Title must be at least 5 characters"),
        problemStatement: z.string().min(10, "Problem must be at least 10 characters"),
        solution: z.string().min(10, "Solution must be at least 10 characters"),
        description: z.string().min(20, "Description must be at least 20 characters"),
        categoryId: z.string().min(1, "Category ID is required"),
        isPaid: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional().default(false),
        price: z.coerce.number().optional().default(0),
    })
});


export const updateIdeaStatusSchema = z.object({
    status: z.nativeEnum(IdeaStatus),
    feedback: z.string().optional(),
});
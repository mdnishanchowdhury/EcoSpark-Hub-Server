import { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const validateRequest = (zodSchema: z.ZodObject<any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (req.body && req.body.data) {
                try {
                    req.body = JSON.parse(req.body.data);
                } catch (error) {
                    // Ignore JSON parse errors
                }
            }

            const parsedResult = await zodSchema.safeParse({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            if (!parsedResult.success) {
                return next(parsedResult.error);
            }

            req.body = parsedResult.data.body;
            Object.assign(req.params, parsedResult.data.params);
            Object.assign(req.query, parsedResult.data.query);

            next();
        } catch (error) {
            next(error);
        }
    };
};
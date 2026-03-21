import { Request, Response } from "express";
import status from "http-status";

export const notFount = (req: Request, res: Response) => {
    res.status(status.NOT_FOUND).json({
        success: false,
        message: `Route ${req.originalUrl} Not Found`
    })
}
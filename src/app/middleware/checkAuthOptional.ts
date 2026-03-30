import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { CookieUtils } from "../utils/cookie";
import { jwtUtils } from "../utils/jwt";
import { envVars } from "../config/env";
import { Role } from "../../generated/prisma/enums";

export const checkAuthOptional = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sessionToken = CookieUtils.getCookie(req, "better-auth.session_token");
        const accessToken = CookieUtils.getCookie(req, 'accessToken');

        if (!sessionToken && !accessToken) {
            return next();
        }

        let authenticatedUser: any = null;

        if (sessionToken) {
            const sessionExists = await prisma.session.findFirst({
                where: {
                    token: sessionToken,
                    expiresAt: { gt: new Date() }
                },
                include: { user: true }
            });

            if (sessionExists && sessionExists.user) {
                authenticatedUser = sessionExists.user;
            }
        }

        if (!authenticatedUser && accessToken) {
            const verifiedToken = jwtUtils.verifyToken(accessToken, envVars.ACCESS_TOKEN_SECRET);
            if (verifiedToken.success) {
                authenticatedUser = await prisma.user.findUnique({
                    where: { id: (verifiedToken.data as any).userId }
                });
            }
        }

        if (authenticatedUser && authenticatedUser.isActive && !authenticatedUser.isDeleted) {
            req.user = {
                userId: authenticatedUser.id,
                role: authenticatedUser.role as Role,
                email: authenticatedUser.email,
            };
        }

        next();
    } catch (error: any) {
        console.error("Optional Auth Error:", error.message);
        next();
    }
};
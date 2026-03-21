import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { Role } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { prisma } from "../lib/prisma";
import { CookieUtils } from "../utils/cookie";
import { jwtUtils } from "../utils/jwt";
import AppError from "../../errorHelpers/AppError";


export const checkAuth = (...authRoles: Role[]) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const sessionToken = CookieUtils.getCookie(req, "better-auth.session_token");
            const accessToken = CookieUtils.getCookie(req, 'accessToken');

            if (!sessionToken && !accessToken) {
                throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! Login required.');
            }

            let authenticatedUser: any = null;

            // Better-Auth Session Check
            if (sessionToken) {
                const sessionExists = await prisma.session.findFirst({
                    where: {
                        token: sessionToken,
                        expiresAt: { gt: new Date() }
                    },
                    include: { user: true }
                });

                if (sessionExists && sessionExists.user) {
                    const user = sessionExists.user;

                    // Session Refresh Logic
                    const now = new Date();
                    const expiresAt = new Date(sessionExists.expiresAt);
                    const createdAt = new Date(sessionExists.createdAt);
                    const sessionLifeTime = expiresAt.getTime() - createdAt.getTime();
                    const timeRemaining = expiresAt.getTime() - now.getTime();
                    const percentRemaining = (timeRemaining / sessionLifeTime) * 100;

                    if (percentRemaining < 20) {
                        res.setHeader('X-Session-Refresh', 'true');
                    }

                    authenticatedUser = user;
                }
            }

            // Access Token Check (Fallback)
            if (!authenticatedUser && accessToken) {
                const verifiedToken = jwtUtils.verifyToken(accessToken, envVars.ACCESS_TOKEN_SECRET);
                if (verifiedToken.success) {
                    authenticatedUser = await prisma.user.findUnique({
                        where: { id: (verifiedToken.data as any).userId }
                    });
                }
            }

            if (!authenticatedUser) {
                throw new AppError(status.UNAUTHORIZED, 'Invalid or expired session.');
            }

            if (!authenticatedUser.isActive || authenticatedUser.isDeleted) {
                throw new AppError(status.FORBIDDEN, 'User account is inactive or deleted.');
            }

            if (authRoles.length > 0 && !authRoles.includes(authenticatedUser.role as Role)) {
                throw new AppError(status.FORBIDDEN, 'Forbidden access! You do not have permission.');
            }

            req.user = {
                userId: authenticatedUser.id,
                role: authenticatedUser.role as Role,
                email: authenticatedUser.email,
            };

            next();
        } catch (error: any) {
            next(error);
        }
    };
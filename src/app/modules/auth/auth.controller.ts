import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { catchAsync } from "../../shared/catchAsnc";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { tokenUtils } from "../../utils/token";
import AppError from "../../../errorHelpers/AppError";
import { Role } from "../../../generated/prisma/enums";
import { CookieUtils } from "../../utils/cookie";

export interface IAuthRequest extends Request {
    user?: {
        userId: string;
        role: Role;
        email: string;
    }
}

const registerMember = catchAsync(
    async (req: Request, res: Response) => {
        const payload = req.body;

        const result = await AuthService.registerMember(payload);

        const { accessToken, refreshToken, token, ...rest } = result;
        tokenUtils.setAccessTokenCookie(res, accessToken);
        tokenUtils.setRefreshTokenCookie(res, refreshToken);
        tokenUtils.setBetterAuthSessionCookie(res, token as string);

        sendResponse(res, {
            httpStatusCode: status.CREATED,
            success: true,
            message: "Member registered successfully",
            data: {
                data: {
                    token,
                    accessToken,
                    refreshToken,
                    ...rest
                }
            }
        })
    }
)

const loginMember = catchAsync(
    async (req: Request, res: Response) => {
        const payload = req.body;

        const result = await AuthService.loginMember(payload);

        const { accessToken, refreshToken, token, ...rest } = result;

        tokenUtils.setAccessTokenCookie(res, accessToken);
        tokenUtils.setRefreshTokenCookie(res, refreshToken);
        tokenUtils.setBetterAuthSessionCookie(res, token);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Member logged in successfully",
            data: {
                token,
                accessToken,
                refreshToken,
                ...rest
            }
        })
    }
)

const verifyEmail = catchAsync(
    async (req: Request, res: Response) => {
        const { email, otp } = req.body;
        await AuthService.verifyEmail(email, otp);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Email verified successfully",
        });
    }
)

const getMe = catchAsync(
    async (req: IAuthRequest, res: Response) => {
        const user = req.user;

        if (!user) {
            throw new AppError(status.UNAUTHORIZED, "Member not authenticated");
        }

        const result = await AuthService.getMe(user);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Member profile fetched successfully",
            data: result
        })
    }
)

const changePassword = catchAsync(
    async (req: Request, res: Response) => {
        const payload = req.body;

        const betterAuthSessionToken = req.cookies["better-auth.session_token"];

        const result = await AuthService.changePassword(payload, betterAuthSessionToken);

        const { accessToken, refreshToken, token } = result;

        tokenUtils.setAccessTokenCookie(res, accessToken);
        tokenUtils.setRefreshTokenCookie(res, refreshToken);
        tokenUtils.setBetterAuthSessionCookie(res, token as string);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Password changed successfully",
            data: result,
        });
    }
)

const logoutUser = catchAsync(
    async (req: Request, res: Response) => {
        const betterAuthSessionToken = req.cookies["better-auth.session_token"];
        const result = await AuthService.logoutUser(betterAuthSessionToken);
        CookieUtils.clearCookie(res, 'accessToken', {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });
        CookieUtils.clearCookie(res, 'refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });
        CookieUtils.clearCookie(res, 'better-auth.session_token', {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "User logged out successfully",
            data: result,
        });
    }
)

export const AuthController = {
    registerMember,
    loginMember,
    verifyEmail,
    getMe,
    changePassword,
    logoutUser
};
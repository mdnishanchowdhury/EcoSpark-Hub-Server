import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { catchAsync } from "../../shared/catchAsnc";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { tokenUtils } from "../../utils/token";
import AppError from "../../../errorHelpers/AppError";
import { CookieUtils } from "../../utils/cookie";
import { envVars } from "../../config/env";
import { auth } from "../../lib/auth";

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

        if (result.isUnverified) {
            return sendResponse(res, {
                httpStatusCode: status.OK,
                success: true,
                message: "Email not verified",
                data: {
                    user: result.user,
                    isUnverified: true
                }
            });
        }

        const { accessToken, refreshToken, token, ...rest } = result as {
            accessToken: string;
            refreshToken: string;
            token: string;
            [key: string]: any;
        };

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
        });
    }
);


const verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    const result = await AuthService.verifyEmail(email, otp);

    tokenUtils.setAccessTokenCookie(res, result.accessToken);
    tokenUtils.setRefreshTokenCookie(res, result.refreshToken);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Email verified successfully",
        data: {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            token: result.token,
            user: result.user
        }
    });
});

const getMe = catchAsync(
    async (req: Request, res: Response) => {
        const user = req.user;

        if (!user) {
            return sendResponse(res, {
                httpStatusCode: status.OK,
                success: true,
                message: "Guest user - not authenticated",
                data: null
            });
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

const forgetPassword = catchAsync(
    async (req: Request, res: Response) => {
        const { email } = req.body;
        await AuthService.forgetPassword(email);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Password reset OTP sent to email successfully",
        });
    }
)

const resetPassword = catchAsync(
    async (req: Request, res: Response) => {
        const { email, otp, newPassword } = req.body;
        await AuthService.resetPassword(email, otp, newPassword);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Password reset successfully",
        });
    }
)

const getNewToken = catchAsync(
    async (req: Request, res: Response) => {
        const refreshToken = req.cookies.refreshToken;
        const betterAuthSessionToken = req.cookies["better-auth.session_token"];
        if (!refreshToken) {
            throw new AppError(status.UNAUTHORIZED, "Refresh token is missing");
        }
        const result = await AuthService.getNewToken(refreshToken, betterAuthSessionToken);

        const { accessToken, refreshToken: newRefreshToken, sessionToken } = result;

        tokenUtils.setAccessTokenCookie(res, accessToken);
        tokenUtils.setRefreshTokenCookie(res, newRefreshToken);
        tokenUtils.setBetterAuthSessionCookie(res, sessionToken);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "New tokens generated successfully",
            data: {
                accessToken,
                refreshToken: newRefreshToken,
                sessionToken,
            },
        });
    }
)

const googleLogin = catchAsync((req: Request, res: Response) => {
    const redirectPath = req.query.redirect || "/dashboard";

    const encodedRedirectPath = encodeURIComponent(redirectPath as string);

    const callbackURL = `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success?redirect=${encodedRedirectPath}`;

    res.render("googleRedirect", {
        callbackURL: callbackURL,
        betterAuthUrl: envVars.BETTER_AUTH_URL,
    })
})

const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
    const redirectPath = (req.query.redirect as string) || "/dashboard";
    const sessionToken = req.cookies["better-auth.session_token"];

    if (!sessionToken) {
        return res.redirect(`${envVars.FRONTEND_URL}/login?error=oauth_failed`);
    }

    const session = await auth.api.getSession({
        headers: { "Cookie": `better-auth.session_token=${sessionToken}` }
    });

    if (!session || !session.user) {
        return res.redirect(`${envVars.FRONTEND_URL}/login?error=no_session_found`);
    }

    const result = await AuthService.googleLoginSuccess(session);

    const { accessToken, refreshToken, user } = result;

    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);

    const isValidRedirectPath = redirectPath.startsWith("/") && !redirectPath.startsWith("//");
    let finalPath = isValidRedirectPath ? redirectPath : "/dashboard";

    if (finalPath === "/dashboard" || finalPath === "/") {
        finalPath = user.role === "ADMIN" ? "/admin/dashboard" : "/member/dashboard";
    }

    res.redirect(`${envVars.FRONTEND_URL}${finalPath}`);
});

const handleOAuthError = catchAsync((req: Request, res: Response) => {
    const error = req.query.error as string || "oauth_failed";
    res.redirect(`${envVars.FRONTEND_URL}/login?error=${error}`);
})


export const AuthController = {
    registerMember,
    loginMember,
    verifyEmail,
    getMe,
    changePassword,
    logoutUser,
    forgetPassword,
    resetPassword,
    getNewToken,
    googleLogin,
    googleLoginSuccess,
    handleOAuthError
};
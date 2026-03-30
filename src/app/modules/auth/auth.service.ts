import status from "http-status";
import AppError from "../../../errorHelpers/AppError";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { tokenUtils } from "../../utils/token";
import { Role } from "../../../generated/prisma/enums";
import { IChangePasswordPayload, ILoginPayload, IRegisterPayload } from "./auth.interface";
import { jwtUtils } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";


const registerMember = async (payload: IRegisterPayload) => {

    const { name, email, password } = payload;

    const data = await auth.api.signUpEmail({
        body: {
            name,
            email,
            password,
        }
    })

    if (!data.user) {
        throw new Error("Failed to register Member")
    }

    // token 
    const accessToken = tokenUtils.getAccessToken({
        userId: data.user.id,
        role: data.user.role,
        name: data.user.name,
        email: data.user.email,
        emailVerified: data.user.emailVerified
    })

    const refreshToken = tokenUtils.getRefreshToken({
        userId: data.user.id,
        role: data.user.role,
        name: data.user.name,
        email: data.user.email,
        emailVerified: data.user.emailVerified
    })

    return {
        ...data,
        accessToken,
        refreshToken
    }

}

const loginMember = async (payload: ILoginPayload) => {
    const { email, password } = payload;

    try {
        const data = await auth.api.signInEmail({
            body: {
                email,
                password
            }
        });

        if (!data.user.emailVerified) {
            return {
                ...data,
                accessToken: null,
                refreshToken: null,
                isUnverified: true
            };
        }

        const tokenPayload = {
            userId: data.user.id,
            role: data.user.role,
            name: data.user.name,
            email: data.user.email,
            emailVerified: data.user.emailVerified
        };

        const accessToken = tokenUtils.getAccessToken(tokenPayload);
        const refreshToken = tokenUtils.getRefreshToken(tokenPayload);

        return {
            ...data,
            accessToken,
            refreshToken,
            isUnverified: false
        };

    } catch (error: any) {
        if (error.code === 'EMAIL_NOT_VERIFIED' || error.message?.includes("verified")) {
            return {
                user: { email },
                isUnverified: true,
                token: null,
                accessToken: null,
                refreshToken: null
            };
        }
        throw error;
    }
}


const verifyEmail = async (email: string, otp: string) => {
    const result = await auth.api.verifyEmailOTP({
        body: { email, otp }
    });

    if (!result.status) {
        throw new Error("Invalid or expired OTP");
    }

    const updatedUser = await prisma.user.update({
        where: { email },
        data: { emailVerified: true }
    });

    const accessToken = tokenUtils.getAccessToken({
        userId: updatedUser.id,
        role: updatedUser.role,
        name: updatedUser.name,
        email: updatedUser.email
    });

    const refreshToken = tokenUtils.getRefreshToken({
        userId: updatedUser.id,
        role: updatedUser.role,
        name: updatedUser.name,
    });

    return {
        accessToken,
        refreshToken,
        token: accessToken,
        user: updatedUser
    };
};

const getMe = async (user: { userId: string, role: Role }) => {
    const isUserExists = await prisma.user.findUnique({
        where: {
            id: user.userId,
        },
        include: {
            ideas: true,
            votes: true,
            comments: true,
            purchasedIdeas: true
        }
    });

    if (!isUserExists) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    return isUserExists;
};

const changePassword = async (payload: IChangePasswordPayload, sessionToken: string) => {

    const session = await auth.api.getSession({
        headers: new Headers({
            Authorization: `Bearer ${sessionToken}`
        })
    })


    if (!session) {
        throw new AppError(status.UNAUTHORIZED, "Invalid session token");
    }

    const { currentPassword, newPassword } = payload;

    const result = await auth.api.changePassword({
        body: {
            currentPassword,
            newPassword,
            revokeOtherSessions: true,
        },
        headers: new Headers({
            Authorization: `Bearer ${sessionToken}`
        })
    })

    if (session.user.needPasswordChange) {
        await prisma.user.update({
            where: {
                id: session.user.id,
            },
            data: {
                needPasswordChange: false,
            }
        })
    }

    const accessToken = tokenUtils.getAccessToken({
        userId: session.user.id,
        role: session.user.role,
        name: session.user.name,
        email: session.user.email,
        status: session.user.isActive,
        isDeleted: session.user.isDeleted,
        emailVerified: session.user.emailVerified,
    });

    const refreshToken = tokenUtils.getRefreshToken({
        userId: session.user.id,
        role: session.user.role,
        name: session.user.name,
        email: session.user.email,
        status: session.user.isActive,
        isDeleted: session.user.isDeleted,
        emailVerified: session.user.emailVerified,
    });


    return {
        ...result,
        accessToken,
        refreshToken,
    }
}

const logoutUser = async (sessionToken: string) => {
    const result = await auth.api.signOut({
        headers: new Headers({
            Authorization: `Bearer ${sessionToken}`
        })
    })

    return result;
}

const forgetPassword = async (email: string) => {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    if (!user.emailVerified) {
        throw new AppError(status.BAD_REQUEST, "Email not verified");
    }

    if (!user.isActive || user.isDeleted || user.deletedAt) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    try {
        await auth.api.requestPasswordResetEmailOTP({
            body: { email },
        });
    } catch (error: any) {
        console.error("Failed to send password reset OTP:", error);
        throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to send password reset email");
    }

    return { message: "Password reset OTP sent successfully" };
};

const resetPassword = async (email: string, otp: string, newPassword: string) => {

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    if (!user.emailVerified) {
        throw new AppError(status.BAD_REQUEST, "Email not verified");
    }

    if (!user.isActive || user.isDeleted || user.deletedAt) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    try {
        await auth.api.resetPasswordEmailOTP({
            body: {
                email,
                otp,
                password: newPassword,
            },
        });
    } catch (error: any) {
        console.error("Failed to reset password:", error);
        throw new AppError(status.BAD_REQUEST, "Invalid OTP or reset failed");
    }

    if (user.needPasswordChange) {
        await prisma.user.update({
            where: { id: user.id },
            data: { needPasswordChange: false },
        });
    }

    await prisma.session.deleteMany({
        where: { userId: user.id },
    });

    return { message: "Password has been reset successfully" };
};

const getNewToken = async (refreshToken: string, sessionToken: string) => {
    if (!refreshToken || refreshToken === "undefined" || !sessionToken || sessionToken === "undefined") {
        throw new AppError(status.UNAUTHORIZED, "Session expired, please login again");
    }


    const verifiedRefreshToken = jwtUtils.verifyToken(refreshToken, envVars.REFRESH_TOKEN_SECRET as string);

    if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
        throw new AppError(status.UNAUTHORIZED, "Invalid refresh token");
    }

    const data = verifiedRefreshToken.data as JwtPayload;

    const isSessionTokenExists = await prisma.session.findFirst({
        where: { token: sessionToken },
        include: { user: true }
    });

    if (!isSessionTokenExists) {
        const user = await prisma.user.findUnique({ where: { id: data.userId } });
        if (!user) throw new AppError(status.UNAUTHORIZED, "User not found");
    }

    const tokenPayload = {
        userId: data.userId,
        role: data.role,
        name: data.name,
        email: data.email,
        emailVerified: data.emailVerified,
    };

    const newAccessToken = tokenUtils.getAccessToken(tokenPayload);
    const newRefreshToken = tokenUtils.getRefreshToken(tokenPayload);

    let finalSessionToken = sessionToken;
    if (isSessionTokenExists) {
        const updatedSession = await prisma.session.update({
            where: { id: isSessionTokenExists.id },
            data: {
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                updatedAt: new Date(),
            }
        });
        finalSessionToken = updatedSession.token;
    }

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        sessionToken: finalSessionToken,
    };
};

const googleLoginSuccess = async (session: Record<string, any>) => {
    const isUserExists = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!isUserExists) { /* ... */ }

    const accessToken = tokenUtils.getAccessToken({
        userId: session.user.id,
        role: session.user.role,
        name: session.user.name,
        email: session.user.email
    });

    const refreshToken = tokenUtils.getRefreshToken({
        userId: session.user.id,
        role: session.user.role,
        name: session.user.name,
    });

    return {
        accessToken,
        refreshToken,
        user: session.user
    };
};

export const AuthService = {
    registerMember,
    loginMember,
    verifyEmail,
    getMe,
    changePassword,
    logoutUser,
    forgetPassword,
    resetPassword,
    getNewToken,
    googleLoginSuccess
}
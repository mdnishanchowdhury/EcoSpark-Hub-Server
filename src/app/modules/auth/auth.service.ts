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

    const data = await auth.api.signInEmail({
        body: {
            email,
            password
        }
    })


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

const verifyEmail = async (email: string, otp: string) => {

    const result = await auth.api.verifyEmailOTP({
        body: {
            email,
            otp,
        }
    })

    if (result.status && !result.user.emailVerified) {
        await prisma.user.update({
            where: {
                email,
            },
            data: {
                emailVerified: true,
            }
        })
    }
}

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

    const isSessionTokenExists = await prisma.session.findUnique({
        where: {
            token: sessionToken,
        },
        include: {
            user: true,
        }
    })

    if (!isSessionTokenExists) {
        throw new AppError(status.UNAUTHORIZED, "Invalid session token");
    }

    const verifiedRefreshToken = jwtUtils.verifyToken(refreshToken, envVars.REFRESH_TOKEN_SECRET)


    if (!verifiedRefreshToken.success && verifiedRefreshToken.error) {
        throw new AppError(status.UNAUTHORIZED, "Invalid refresh token");
    }

    const data = verifiedRefreshToken.data as JwtPayload;

    const newAccessToken = tokenUtils.getAccessToken({
        userId: data.userId,
        role: data.role,
        name: data.name,
        email: data.email,
        status: data.status,
        isDeleted: data.isDeleted,
        emailVerified: data.emailVerified,
    });

    const newRefreshToken = tokenUtils.getRefreshToken({
        userId: data.userId,
        role: data.role,
        name: data.name,
        email: data.email,
        status: data.status,
        isDeleted: data.isDeleted,
        emailVerified: data.emailVerified,
    });

    const { token } = await prisma.session.update({
        where: {
            token: sessionToken
        },
        data: {
            token: sessionToken,
            expiresAt: new Date(Date.now() + 60 * 60 * 60 * 24 * 1000),
            updatedAt: new Date(),
        }
    })

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        sessionToken: token,
    }

};

const googleLoginSuccess = async (session: Record<string, any>) => {
    const isUserExists = await prisma.user.findUnique({
        where: {
            id: session.user.id,
        }
    });

    if (!isUserExists) {
    }

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
    }
}

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
import status from "http-status";
import AppError from "../../../errorHelpers/AppError";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { tokenUtils } from "../../utils/token";
import { Role } from "../../../generated/prisma/enums";
import { IChangePasswordPayload, ILoginPayload, IRegisterPayload } from "./auth.interface";


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

export const AuthService = {
    registerMember,
    loginMember,
    verifyEmail,
    getMe,
    changePassword,
    logoutUser
}
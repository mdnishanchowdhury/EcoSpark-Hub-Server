import { IdeaStatus, PaymentStatus, Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

export interface IAuthUser {
    userId: string;
    email: string;
    role: Role;
    iat?: number;
    exp?: number;
}

const fetchDashboardMetaData = async (user: IAuthUser) => {
    let metaData;
    switch (user?.role) {
        case Role.ADMIN:
            metaData = await getAdminMetaData();
            break;
        case Role.MEMBER:
            metaData = await getMemberMetaData(user);
            break;
        default:
            throw new Error('Invalid user role!');
    }
    return metaData;
};

const getAdminMetaData = async () => {
    const totalUsers = await prisma.user.count({ where: { isDeleted: false } });
    const totalIdeas = await prisma.idea.count();
    const totalCategories = await prisma.category.count();

    const totalRevenue = await prisma.purchasedIdea.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.PAID }
    });

    const ideaStatusDistribution = await prisma.idea.groupBy({
        by: ['status'],
        _count: { id: true }
    });

    const barChartData = await prisma.$queryRaw`
        SELECT DATE_TRUNC('month', "createdAt") AS month,
        CAST(COUNT(*) AS INTEGER) AS count
        FROM "idea"
        GROUP BY month
        ORDER BY month ASC
    `;

    return {
        totalUsers,
        totalIdeas,
        totalCategories,
        totalRevenue: totalRevenue._sum.amount || 0,
        ideaStatusDistribution,
        barChartData
    };
};

const getMemberMetaData = async (user: IAuthUser) => {
    const currentId = user.userId;

    const myTotalIdeas = await prisma.idea.count({
        where: { authorId: currentId }
    });

    const approvedIdeas = await prisma.idea.count({
        where: { authorId: currentId, status: IdeaStatus.APPROVED }
    });

    const purchasedIdeasCount = await prisma.purchasedIdea.count({
        where: { userId: currentId, status: PaymentStatus.PAID }
    });

    const myIdeasCommentsCount = await prisma.comment.count({
        where: {
            idea: { authorId: currentId }
        }
    });

    return {
        myTotalIdeas,
        approvedIdeas,
        purchasedIdeasCount,
        myIdeasCommentsCount
    };
};

export const MetaService = {
    fetchDashboardMetaData
};
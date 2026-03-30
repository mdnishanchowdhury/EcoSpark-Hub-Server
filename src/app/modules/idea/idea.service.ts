import { Idea, IdeaStatus } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../config/stripe.config";
import { envVars } from "../../config/env";
import { v7 as uuidv7 } from "uuid";
import AppError from "../../../errorHelpers/AppError";

const createIdea = async (authorId: string, payload: Idea): Promise<Idea> => {
    const result = await prisma.idea.create({
        data: {
            ...payload,
            authorId,
            isPaid: (payload.price ?? 0) > 0,
            price: payload.price ?? 0,
            status: IdeaStatus.UNDER_REVIEW,
        },
    });
    return result;
};

const getAllIdeas = async (filters: any, userId?: string) => {
    const { searchTerm, categoryId, isPaid } = filters;

    const ideas = await prisma.idea.findMany({
        where: {
            status: "APPROVED",
            ...(categoryId && { categoryId }),
            ...(isPaid !== undefined && { isPaid: isPaid === 'true' }),
            ...(searchTerm && {
                OR: [
                    { title: { contains: searchTerm, mode: 'insensitive' } },
                    { description: { contains: searchTerm, mode: 'insensitive' } },
                ],
            }),
        },
        include: {
            author: { select: { name: true, email: true, image: true } },
            category: true,
            votes: true,
            comments: {
                where: { parentId: null },
                include: {
                    user: { select: { name: true, image: true } },
                    replies: {
                        include: {
                            user: { select: { name: true, image: true } }
                        },
                        orderBy: { createdAt: 'asc' }
                    }
                },
                orderBy: { createdAt: 'desc' }
            },
            _count: { select: { comments: true } },
            purchasers: userId ? {
                where: {
                    userId: userId,
                    status: 'PAID'
                }
            } : false,
        },
        orderBy: { createdAt: 'desc' }
    });

    return ideas.map((idea: any) => {
        const isAuthor = userId && idea.authorId === userId;

        const hasPurchased = idea.purchasers && idea.purchasers.length > 0;

        const shouldHide = idea.isPaid && !isAuthor && !hasPurchased;

        const { purchasers, votes, ...ideaData } = idea;

        const upVotes = votes.filter((v: any) => v.type === 'UPVOTE').length;
        const downVotes = votes.length - upVotes;

        return {
            ...ideaData,
            votes: votes,
            description: shouldHide
                ? `${idea.description?.substring(0, 100)}... (Buy to see more)`
                : idea.description,
            solution: shouldHide ? "Locked" : idea.solution,
            problemStatement: shouldHide
                ? `${idea.problemStatement?.substring(0, 50)}...`
                : idea.problemStatement,
            upVotes,
            downVotes,
            totalVotes: votes.length,
            isLocked: shouldHide
        };
    });
};

const initiateIdeaPayment = async (ideaId: string, userId: string) => {
    const ideaData = await prisma.idea.findUniqueOrThrow({
        where: { id: ideaId, isPaid: true }
    });

    const price = ideaData.price ?? 0;

    const existingPurchase = await prisma.purchasedIdea.findUnique({
        where: { userId_ideaId: { userId, ideaId } }
    });

    if (existingPurchase?.status === 'PAID') {
        throw new Error("You have already purchased this idea!");
    }

    const transactionId = `TXN-${uuidv7()}`;

    const purchaseRecord = await prisma.purchasedIdea.upsert({
        where: { userId_ideaId: { userId, ideaId } },
        update: { transactionId, status: 'PENDING' },
        create: {
            userId,
            ideaId,
            amount: price,
            transactionId,
            status: 'PENDING'
        }
    });

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: 'payment',
        line_items: [{
            price_data: {
                currency: "usd",
                product_data: {
                    name: ideaData.title,
                    description: ideaData.description ?? "EcoSpark Hub Idea Content"
                },
                unit_amount: Math.round(price * 100),
            },
            quantity: 1,
        }],
        metadata: {
            userId,
            ideaId,
            transactionId: purchaseRecord.transactionId
        },
        success_url: `${envVars.FRONTEND_URL}/payment/success?ideaId=${ideaId}`,
        cancel_url: `${envVars.FRONTEND_URL}/ideas/${ideaId}?error=payment_cancelled`,
    });

    return { paymentUrl: session.url };
};

const getIdeaById = async (id: string, userId?: string, userRole?: string) => {
    const result = await prisma.idea.findUnique({
        where: { id },
        include: {
            author: { select: { name: true, image: true, id: true } },
            category: true,
            votes: true,
            purchasers: userId ? {
                where: {
                    userId: userId,
                    status: 'PAID'
                }
            } : false,
            comments: {
                where: { parentId: null },
                include: {
                    user: { select: { name: true, image: true } },
                    replies: {
                        include: {
                            user: { select: { name: true, image: true } },
                            replies: {
                                include: {
                                    user: { select: { name: true, image: true } },
                                    replies: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'asc' }
                    }
                },
                orderBy: { createdAt: 'desc' }
            },
            _count: { select: { comments: true } }
        }
    });

    if (!result) {
        throw new AppError(404, "Idea not found!");
    }

    const idea = result as any;
    const isAuthor = userId && idea.authorId === userId;
    const isAdmin = userRole === 'ADMIN';
    const hasPurchased = (idea.purchasers && idea.purchasers.length > 0);
    const shouldHide = idea.isPaid && !isAuthor && !hasPurchased && !isAdmin;

    const votesArray = idea.votes || [];
    const upVotes = votesArray.filter((v: any) => v.type === 'UPVOTE').length;
    const totalVotes = votesArray.length;
    const downVotes = totalVotes - upVotes;

    const { purchasers, votes, ...ideaData } = idea;

    return {
        ...ideaData,
        votes: votesArray,
        description: shouldHide
            ? `${idea.description?.substring(0, 150)}... (Buy to see more)`
            : idea.description,
        solution: shouldHide ? "Locked" : idea.solution,
        problemStatement: shouldHide
            ? `${idea.problemStatement?.substring(0, 100)}...`
            : idea.problemStatement,
        isLocked: shouldHide,
        upVotes,
        downVotes,
        totalVotes
    };
};

const cancelUnpaidPurchases = async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    return await prisma.purchasedIdea.deleteMany({
        where: {
            status: 'PENDING',
            createdAt: { lte: thirtyMinutesAgo }
        }
    });
};

const getMyIdeas = async (authorId: string) => {
    const ideas = await prisma.idea.findMany({
        where: { authorId },
        include: {
            category: true,
            votes: true,
            _count: { select: { comments: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return ideas.map((idea) => {
        const upVotes = idea.votes.filter(v => v.type === 'UPVOTE').length;
        const downVotes = idea.votes.length - upVotes;
        const { votes, ...ideaData } = idea;
        return { ...ideaData, upVotes, downVotes, totalVotes: idea.votes.length };
    });
};

const getPendingIdeasForAdmin = async () => {
    return await prisma.idea.findMany({
        where: { status: IdeaStatus.UNDER_REVIEW },
        include: {
            author: { select: { name: true, email: true } },
            category: true,
            _count: { select: { votes: true, comments: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
};

const updateIdeaStatus = async (id: string, status: IdeaStatus, feedback?: string) => {
    return await prisma.idea.update({
        where: { id },
        data: {
            status,
            feedback: feedback || null
        }
    });
};

export const IdeaService = {
    createIdea,
    getAllIdeas,
    initiateIdeaPayment,
    getIdeaById,
    cancelUnpaidPurchases,
    getMyIdeas,
    getPendingIdeasForAdmin,
    updateIdeaStatus
};
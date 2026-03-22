
import { Idea, IdeaStatus } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const createIdea = async (authorId: string, payload: Idea): Promise<Idea> => {
    const result = await prisma.idea.create({
        data: {
            ...payload,
            authorId,
        },
    });
    return result;
};

const getAllIdeas = async (filters: any) => {
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
            _count: { select: { comments: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return ideas.map((idea) => {
        const upVotes = idea.votes.filter(v => v.type === 'UPVOTE').length;
        const downVotes = idea.votes.length - upVotes;

        const { votes, ...ideaData } = idea;

        return {
            ...ideaData,
            upVotes,
            downVotes,
            totalVotes: idea.votes.length
        };
    });
};

const getIdeaById = async (id: string) => {
    const result = await prisma.idea.findUnique({
        where: { id },
        include: {
            author: { select: { name: true, image: true } },
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
            _count: { select: { comments: true } }
        }
    });

    if (!result) throw new Error("Idea not found!");

    const upVotes = result.votes.filter(v => v.type === 'UPVOTE').length;
    const downVotes = result.votes.length - upVotes;

    const { votes, ...ideaData } = result;

    return {
        ...ideaData,
        upVotes,
        downVotes,
        totalVotes: result.votes.length
    };
};

const getMyIdeas = async (authorId: string) => {
    const ideas = await prisma.idea.findMany({
        where: {
            authorId: authorId,
        },
        include: {
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
            _count: {
                select: { comments: true }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return ideas.map((idea) => {
        const upVotes = idea.votes.filter(v => v.type === 'UPVOTE').length;
        const downVotes = idea.votes.length - upVotes;
        const { votes, ...ideaData } = idea;

        return {
            ...ideaData,
            upVotes,
            downVotes,
            totalVotes: idea.votes.length
        };
    });
};

const getPendingIdeasForAdmin = async () => {
    return await prisma.idea.findMany({
        where: {
            status: 'UNDER_REVIEW'
        },
        include: {
            author: {
                select: { name: true, email: true }
            },
            category: true,
            _count: {
                select: { votes: true, comments: true }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
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
    getMyIdeas,
    getIdeaById,
    getPendingIdeasForAdmin,
    updateIdeaStatus
};
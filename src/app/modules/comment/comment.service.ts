import { prisma } from "../../lib/prisma";

const createComment = async (userId: string, payload: { content: string; ideaId: string; parentId?: string }) => {
    const isIdeaExist = await prisma.idea.findUnique({ where: { id: payload.ideaId } });
    if (!isIdeaExist) throw new Error("Idea not found!");

    if (payload.parentId) {
        const isParentExist = await prisma.comment.findUnique({ where: { id: payload.parentId } });
        if (!isParentExist) throw new Error("Parent comment not found!");
    }

    return await prisma.comment.create({
        data: {
            content: payload.content,
            userId: userId,
            ideaId: payload.ideaId,
            parentId: payload.parentId || null,
        },
        include: {
            user: { select: { name: true, image: true } }
        }
    });
};

export const CommentService = {
    createComment,
};
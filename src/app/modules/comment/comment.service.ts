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

const updateComment = async (userId: string, commentId: string, content: string) => {
    const comment = await prisma.comment.findUnique({
        where: { id: commentId }
    });

    if (!comment) throw new Error("Comment not found!");
    if (comment.userId !== userId) throw new Error("You can only edit your own comments!");

    return await prisma.comment.update({
        where: { id: commentId },
        data: { content },
        include: {
            user: { select: { name: true, image: true } }
        }
    });
};

const deleteComment = async (userId: string, userRole: string, commentId: string) => {
    const comment = await prisma.comment.findUnique({
        where: { id: commentId }
    });

    if (!comment) throw new Error("Comment not found!");

    const isOwner = comment.userId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOwner && !isAdmin) {
        throw new Error("You don't have permission to delete this comment!");
    }

    return await prisma.comment.delete({
        where: { id: commentId }
    });
};

export const CommentService = {
    createComment,
    updateComment,
    deleteComment
};
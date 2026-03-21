import { VoteType } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const toggleVote = async (userId: string, ideaId: string, type: VoteType) => {
    const idea = await prisma.idea.findUnique({
        where: { id: ideaId }
    });

    if (!idea) {
        throw new Error("Idea not found!");
    }
    return await prisma.$transaction(async (tx) => {
        const existingVote = await tx.vote.findUnique({
            where: {
                userId_ideaId: { userId, ideaId }
            }
        });

        if (existingVote) {
            if (existingVote.type === type) {
                await tx.vote.delete({ where: { id: existingVote.id } });
            } else {
                await tx.vote.update({
                    where: { id: existingVote.id },
                    data: { type }
                });
            }
        } else {
            await tx.vote.create({
                data: { userId, ideaId, type }
            });
        }
        const votes = await tx.vote.findMany({
            where: { ideaId }
        });

        const upVotes = votes.filter(v => v.type === 'UPVOTE').length;
        const downVotes = votes.length - upVotes;

        return {
            message: "Vote updated",
            upVotes,
            downVotes,
            totalVotes: votes.length
        };
    });
};

export const VoteService = {
    toggleVote
};
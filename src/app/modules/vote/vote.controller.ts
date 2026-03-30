import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsnc";
import { VoteService } from "./vote.service";
import { sendResponse } from "../../shared/sendResponse";

const handleVote = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { ideaId, type } = req.body;

    const result = await VoteService.toggleVote(user.userId, ideaId, type);

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        message: result.message === "deleted" ? "Vote removed!" : "Vote recorded!",
        data: result,
    });
});

export const VoteController = {
    handleVote
};
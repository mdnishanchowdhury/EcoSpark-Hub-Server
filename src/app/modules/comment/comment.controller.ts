import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsnc";
import { sendResponse } from "../../shared/sendResponse";
import { CommentService } from "./comment.service";

const createComment = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await CommentService.createComment(user.userId, req.body);

    sendResponse(res, {
        httpStatusCode: 201,
        success: true,
        message: "Comment posted successfully!",
        data: result,
    });
});

export const CommentController = {
    createComment,
};
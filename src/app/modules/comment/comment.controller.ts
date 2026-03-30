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

const updateComment = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { content } = req.body;
    const user = (req as any).user;

    const result = await CommentService.updateComment(user.userId, id as string, content);

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        message: "Comment updated successfully!",
        data: result,
    });
});

const deleteComment = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = (req as any).user;

    await CommentService.deleteComment(user.userId, user.role, id as string);

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        message: "Comment deleted successfully!",
        data: null,
    });
});

export const CommentController = {
    createComment,
    updateComment,
    deleteComment
};
import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsnc";
import { IdeaService } from "./idea.service";
import { sendResponse } from "../../shared/sendResponse";

const createIdea = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await IdeaService.createIdea(user.userId, req.body);

    sendResponse(res, {
        httpStatusCode: 201,
        success: true,
        message: "Idea submitted successfully!",
        data: result,
    });
});

const getAllIdeas = catchAsync(async (req: Request, res: Response) => {
    const filters = req.query;

    const user = (req as any).user;
    const userId = user?.userId || user?.id;

    const result = await IdeaService.getAllIdeas(filters, userId);

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        message: "Ideas fetched successfully",
        data: result,
    });
});

const getMyIdeas = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await IdeaService.getMyIdeas(user.userId);

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        message: "Your submitted ideas retrieved successfully!",
        data: result,
    });
});


const getIdeaById = catchAsync(async (req: Request, res: Response) => {
    const { id: ideaId } = req.params;
    const user = (req as any).user;

    const result = await IdeaService.getIdeaById(ideaId as string, user?.userId);

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        message: "Idea details retrieved",
        data: result,
    });
});

const initiateIdeaPayment = catchAsync(async (req: Request, res: Response) => {
    const { ideaId } = req.params;
    const user = (req as any).user;

    const result = await IdeaService.initiateIdeaPayment(ideaId as string, user.userId);

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        message: "Payment initiation successful",
        data: result,
    });
});

// Admin Review
const getPendingIdeasForAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await IdeaService.getPendingIdeasForAdmin();

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        message: "Pending ideas for review retrieved successfully!",
        data: result,
    });
});

const updateIdeaStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, feedback } = req.body;

    const result = await IdeaService.updateIdeaStatus(id as string, status, feedback);

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        message: `Idea status updated to ${status} successfully!`,
        data: result,
    });
});

export const IdeaController = {
    createIdea,
    getAllIdeas,
    getMyIdeas,
    getIdeaById,
    initiateIdeaPayment,
    getPendingIdeasForAdmin,
    updateIdeaStatus,
};
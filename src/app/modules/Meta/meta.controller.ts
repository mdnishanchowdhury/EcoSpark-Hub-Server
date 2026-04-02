import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsnc";
import { MetaService } from "./meta.service";
import { sendResponse } from "../../shared/sendResponse";


const fetchDashboardMetaData = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await MetaService.fetchDashboardMetaData(user);

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        message: "Dashboard metadata retrieved successfully!",
        data: result
    });
});

export const MetaController = {
    fetchDashboardMetaData
};
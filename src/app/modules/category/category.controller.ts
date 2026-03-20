import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsnc";
import { sendResponse } from "../../shared/sendResponse";
import { CategoryService } from "./category.service";


const createCategory = catchAsync(
    async (req: Request, res: Response) => {
        const payload = req.body
        const result = await CategoryService.createCategory(payload);
        sendResponse(res, {
            httpStatusCode: 201,
            success: true,
            message: 'Category created successfully',
            data: result
        });
    }
)

const getAllCategory = catchAsync(
    async (req: Request, res: Response) => {
        const result = await CategoryService.getAllCategory()

        sendResponse(res, {
            httpStatusCode: 201,
            success: true,
            message: 'Category fetched succesfully',
            data: result
        })
    }
)


const getCategoryById = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const result = await CategoryService.getCategoryById(id as string);

        sendResponse(res, {
            httpStatusCode: 201,
            success: true,
            message: 'Category fetched successfully',
            data: result
        })
    }
)
const deleteCategory = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const result = await CategoryService.deleteCategory(id as string);

        sendResponse(res, {
            httpStatusCode: 201,
            success: true,
            message: 'Category deleted successfully',
            data: result
        })
    }
)

export const CategoryController = {
    createCategory,
    getAllCategory,
    deleteCategory,
    getCategoryById
}
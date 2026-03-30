import AppError from "../../../errorHelpers/AppError";
import { Category } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const createCategory = async (payload: { name: string }): Promise<Category> => {
    const existingCategory = await prisma.category.findUnique({
        where: { name: payload.name }
    });

    if (existingCategory) {
        throw new AppError(400, "Category with this name already exists");
    }

    const category = await prisma.category.create({
        data: {
            name: payload.name
        }
    });

    return category;
}


const getAllCategory = async (): Promise<Category[]> => {
    const categories = await prisma.category.findMany();
    return categories;
}

const getCategoryById = async (id: string) => {
    const category = await prisma.category.findUnique({
        where: { id }
    })
    return category;
}

const deleteCategory = async (id: string): Promise<Category> => {
    const category = await prisma.category.delete({
        where: { id }
    })
    return category;
}

export const CategoryService = {
    createCategory,
    getAllCategory,
    deleteCategory,
    getCategoryById
}
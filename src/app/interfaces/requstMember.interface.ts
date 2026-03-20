import { Role } from "../../generated/prisma/enums";

export interface IRequestMember {
    userId: string,
    role: Role,
    email: string
}
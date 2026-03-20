import dotenv from "dotenv";
dotenv.config();

interface EnvConfig {
    PORT: string;
    DATABASE_URL:string;
}

const loadEnvVariables = (): EnvConfig => {

    const requireEnvVariable = [
        'PORT',
        'DATABASE_URL'
    ]

    requireEnvVariable.forEach((varible) => {
        if (!process.env[varible]) {
            throw new Error(`Environment veriable ${varible} is required but not set in .env file`)
        }
    })
    return {
        PORT: process.env.PORT as string,
        DATABASE_URL: process.env.DATABASE_URL as string,
    }
}
export const envVars = loadEnvVariables();
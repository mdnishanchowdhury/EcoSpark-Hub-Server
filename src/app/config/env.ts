import dotenv from "dotenv";
dotenv.config();

interface EnvConfig {
    PORT: string;
}

const loadEnvVariables = (): EnvConfig => {

    const requireEnvVariable = [
        'PORT'
    ]

    requireEnvVariable.forEach((varible) => {
        if (!process.env[varible]) {
            throw new Error(`Environment veriable ${varible} is required but not set in .env file`)
        }
    })
    return {
        PORT: process.env.PORT as string,
    }
}
export const envVars = loadEnvVariables();
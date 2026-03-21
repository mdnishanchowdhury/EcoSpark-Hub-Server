import express, { Application, Request, Response } from "express";
import { IndexRoutes } from "./app/routes";
import { AuthRoutes } from "./app/modules/auth/auth.route";
import cookieParser from "cookie-parser";
import path from "node:path";
import cors from "cors";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFount } from "./app/middleware/notFound";
import { envVars } from "./app/config/env";

const app: Application = express();

app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), `src/app/templates`))

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cookieParser());

app.use(cors({
    origin: [
        envVars.FRONTEND_URL,
        envVars.BETTER_AUTH_URL,
        "http://localhost:3000",
        "http://localhost:5000"
    ],
    credentials: true,
}));

app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1", IndexRoutes);

// Basic route
app.get('/', (req: Request, res: Response) => {
    res.send('Hello, TypeScript + Express!');
});

app.use(globalErrorHandler);
app.use(notFount)

export default app;
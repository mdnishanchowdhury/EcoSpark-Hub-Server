import express, { Application, Request, Response } from "express";
import { IndexRoutes } from "./app/routes";
import { AuthRoutes } from "./app/modules/auth/auth.route";
import cookieParser from "cookie-parser";
import path from "node:path";

const app: Application = express();

app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), `src/app/templates`))

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// Middleware to parse JSON bodies
app.use(express.json());

app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1", IndexRoutes);

// Basic route
app.get('/', (req: Request, res: Response) => {
    res.send('Hello, TypeScript + Express!');
});

export default app;
import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";

export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
}

export function globalErrorHandler(
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
}

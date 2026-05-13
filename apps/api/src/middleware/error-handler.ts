import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error(`[${new Date().toISOString()}] Unhandled error: ${err.message}`);
  res.status(500).json({
    version: 'v2',
    content: { messages: [{ type: 'text', text: "Sorry, I'm having trouble right now. Please try again in a moment!" }] },
  });
}

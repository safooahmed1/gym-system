import { Request, Response, NextFunction } from 'express';
export type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
export declare function asyncHandler(fn: AsyncHandler): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=asyncHandler.d.ts.map
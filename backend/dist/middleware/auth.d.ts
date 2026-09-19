import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../utils/jwt.js';
export interface AuthenticatedRequest extends Request {
    user?: JWTPayload;
}
export declare function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function requireRole(...allowedRoles: ('admin' | 'reception')[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireReception: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireAnyRole: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.d.ts.map
export interface JWTPayload {
    userId: number;
    email: string;
    role: 'admin' | 'reception';
    type: 'access' | 'refresh';
}
export declare function generateAccessToken(payload: Omit<JWTPayload, 'type'>): string;
export declare function generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string;
export declare function verifyAccessToken(token: string): JWTPayload | null;
export declare function verifyRefreshToken(token: string): JWTPayload | null;
export declare function generateTokens(payload: Omit<JWTPayload, 'type'>): {
    accessToken: string;
    refreshToken: string;
};
//# sourceMappingURL=jwt.d.ts.map
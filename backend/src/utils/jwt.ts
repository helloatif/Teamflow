import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

const getJwtSecret = (secret: string | undefined, fallback: string) => secret ?? fallback;

export const signAccessToken = (payload: TokenPayload) =>
  jwt.sign(payload, getJwtSecret(env.JWT_SECRET, 'dev-jwt-secret'), { expiresIn: '15m' });

export const signRefreshToken = (payload: TokenPayload) =>
  jwt.sign(payload, getJwtSecret(env.JWT_REFRESH_SECRET, 'dev-jwt-refresh-secret'), { expiresIn: '7d' });

export const verifyAccessToken = (token: string) => jwt.verify(token, getJwtSecret(env.JWT_SECRET, 'dev-jwt-secret'));

export const verifyRefreshToken = (token: string) => jwt.verify(token, getJwtSecret(env.JWT_REFRESH_SECRET, 'dev-jwt-refresh-secret'));

import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env.js";

const key = new TextEncoder().encode(env.JWT_SECRET);

export interface JWTPayload {
  sub: string; // userId
  role: "USER" | "ADMIN";
}

export const signAccessToken = async (userId: string, role: "USER" | "ADMIN"): Promise<string> => {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRY)
    .sign(key);
};

export const signRefreshToken = async (userId: string, role: "USER" | "ADMIN"): Promise<string> => {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRY)
    .sign(key);
};

export const verifyToken = async (token: string): Promise<JWTPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, key);
    return {
      sub: payload.sub as string,
      role: payload.role as "USER" | "ADMIN",
    };
  } catch (error) {
    return null;
  }
};

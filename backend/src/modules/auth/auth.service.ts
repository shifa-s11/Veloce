import { prisma } from "../../lib/prisma.js";
import { hashPassword, comparePassword } from "../../lib/hash.js";
import { signAccessToken, signRefreshToken, verifyToken } from "../../lib/jwt.js";
import { HttpError } from "../../lib/errors.js";
import { SignupInput, LoginInput } from "@task-manager/shared";

export class AuthService {
  static async signup(input: SignupInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new HttpError(409, "CONFLICT", "Email address is already in use");
    }

    const hashedPassword = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        fullName: input.fullName,
        role: "USER",
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new HttpError(401, "UNAUTHORIZED", "Invalid email or password");
    }

    const isMatch = await comparePassword(input.password, user.password);
    if (!isMatch) {
      throw new HttpError(401, "UNAUTHORIZED", "Invalid email or password");
    }

    const accessToken = await signAccessToken(user.id, user.role);
    const refreshToken = await signRefreshToken(user.id, user.role);

    // Calculate expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refresh(token: string) {
    const decoded = await verifyToken(token);
    if (!decoded) {
      throw new HttpError(401, "UNAUTHORIZED", "Invalid or expired refresh token");
    }

    const dbToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!dbToken || dbToken.expiresAt < new Date()) {
      if (dbToken) {
        await prisma.refreshToken.delete({ where: { token } });
      }
      throw new HttpError(401, "UNAUTHORIZED", "Invalid or expired refresh token");
    }

    const accessToken = await signAccessToken(dbToken.user.id, dbToken.user.role);
    const newRefreshToken = await signRefreshToken(dbToken.user.id, dbToken.user.role);

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { token } });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: dbToken.user.id,
        expiresAt,
      },
    });

    return {
      user: {
        id: dbToken.user.id,
        email: dbToken.user.email,
        fullName: dbToken.user.fullName,
        role: dbToken.user.role,
      },
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async logout(token: string) {
    try {
      await prisma.refreshToken.delete({
        where: { token },
      });
    } catch (error) {
      // Ignore if token doesn't exist
    }
  }
}

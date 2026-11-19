import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const COOKIE_NAME = 'cl_token';

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/** Requires a valid JWT in the httpOnly cookie; attaches req.user. */
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'Not authenticated' });

    // Invalidate tokens issued before the last password change.
    if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime()) {
      return res.status(401).json({ message: 'Session expired, please log in again' });
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Not authenticated' });
  }
}

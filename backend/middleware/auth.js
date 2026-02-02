import { clerkClient, verifyToken } from '@clerk/clerk-sdk-node';
import User from '../models/User.js';

/**
 * Authentication Middleware
 * Verifies Clerk JWT token and loads user using networkless verification
 */
export const authenticateUser = async (req, res, next) => {
  try {
    // Get the session token from the Authorization header
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
    }

    // Verify the JWT token (networkless verification)
    const payload = await verifyToken(sessionToken, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    if (!payload || !payload.sub) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Get user details from Clerk using the userId from the token
    const clerkUser = await clerkClient.users.getUser(payload.sub);

    // Find or create user in our database
    let user = await User.findOne({ clerkId: clerkUser.id });

    if (!user) {
      console.log('Creating new user for Clerk ID:', clerkUser.id);
      // Create new user if doesn't exist
      user = await User.create({
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        name: `${clerkUser.firstName || ''}${clerkUser.lastName || ''}`.trim() || 'User',
        role: clerkUser.publicMetadata?.role || 'passenger',
      });
      console.log('New user created:', user._id, user.email, user.role);
    } else {
      console.log('Found existing user:', user._id, user.email, user.role);
    }

    // Attach user to request object
    req.user = user;
    req.clerkUser = clerkUser;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message,
    });
  }
};

/**
 * Role-based Authorization Middleware
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }

    next();
  };
};

/**
 * Optional Authentication - doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    if (sessionToken) {
      // Verify the JWT token (networkless verification)
      const payload = await verifyToken(sessionToken, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      
      if (payload && payload.sub) {
        const clerkUser = await clerkClient.users.getUser(payload.sub);
        const user = await User.findOne({ clerkId: clerkUser.id });
        req.user = user;
        req.clerkUser = clerkUser;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    console.log('Optional auth failed:', error.message);
  }

  next();
};

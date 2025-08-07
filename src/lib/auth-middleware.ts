// Authentication middleware for API routes
import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from './firebase-admin';

export interface AuthenticatedRequest extends NextRequest {
  user: {
    uid: string;
    email: string;
    email_verified: boolean;
  };
}

/**
 * Middleware to authenticate API requests using Firebase ID tokens
 * Usage: const { user, error } = await authenticateRequest(request);
 */
export async function authenticateRequest(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        user: null,
        error: 'Missing or invalid authorization header',
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ),
      };
    }

    // Extract the token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token with Firebase Admin
    const decodedToken = await verifyIdToken(token);

    return {
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        email_verified: decodedToken.email_verified || false,
      },
      error: null,
      response: null,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    
    return {
      user: null,
      error: 'Invalid or expired token',
      response: NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Higher-order function to wrap API route handlers with authentication
 * Usage: export const POST = withAuth(async (request, { user }) => { ... });
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, context: { user: { uid: string; email: string; email_verified: boolean } }, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const { user, error, response } = await authenticateRequest(request);
    
    if (error || !user) {
      return response!;
    }

    return handler(request, { user }, ...args);
  };
}

/**
 * Optional authentication middleware - doesn't fail if no auth provided
 * Usage: const { user } = await optionalAuth(request);
 */
export async function optionalAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null };
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    return {
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        email_verified: decodedToken.email_verified || false,
      },
    };
  } catch (error) {
    console.error('Optional auth error:', error);
    return { user: null };
  }
}

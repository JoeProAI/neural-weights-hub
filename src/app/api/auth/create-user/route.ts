import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid, email, name } = decodedToken;

    // Create or update user record
    try {
      await adminAuth.updateUser(uid, {
        email,
        displayName: name,
      });
    } catch (error: any) {
      // User might not exist, create them
      if (error.code === 'auth/user-not-found') {
        await adminAuth.createUser({
          uid,
          email,
          displayName: name,
        });
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        uid,
        email,
        name,
      },
    });
  } catch (error: any) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create/update user',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

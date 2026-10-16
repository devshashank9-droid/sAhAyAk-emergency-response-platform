import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin securely using your .env.local keys
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID as string,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL as string,
      // This regex handles newline characters correctly
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY as string).replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tokens, distance, emergencyType } = body;

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ message: 'No volunteers nearby' }, { status: 200 });
    }

    const message = {
      notification: {
        title: '🚨 URGENT: DISTRESS SIGNAL',
        body: `Emergency detected ${distance} meters from your location. Open sAhAyAk to respond immediately.`,
      },
      tokens: tokens, // Array of volunteer device tokens
    };

    // Blast the notification to all nearby volunteers using the modern getMessaging()
    const response = await getMessaging().sendEachForMulticast(message);
    
    return NextResponse.json({ 
      success: true, 
      sent: response.successCount, 
      failed: response.failureCount 
    });

  } catch (error) {
    console.error('FCM Send Error:', error);
    return NextResponse.json({ error: 'Failed to send SOS alerts' }, { status: 500 });
  }
}
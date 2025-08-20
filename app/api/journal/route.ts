import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/services/mongodb';
import { JournalEntry } from '@/lib/types/quote';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const journal = await db
      .collection('journal')
      .find({})
      .sort({ savedAt: -1 })
      .toArray();
    return NextResponse.json(journal, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch journal entries:', error);
    const errorMessage = error.message?.includes('environment variable')
      ? 'Database connection not configured. Please set up MongoDB environment variables in Vercel.'
      : 'Failed to fetch journal entries';
    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const entry: JournalEntry = await request.json();
    const { db } = await connectToDatabase();

    const result = await db.collection('journal').insertOne({
      ...entry,
      savedAt: new Date(),
    });

    return NextResponse.json(
      { message: 'Entry saved', insertedId: result.insertedId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to save journal entry:', error);
    const errorMessage = error.message?.includes('environment variable')
      ? 'Database connection not configured. Please set up MongoDB environment variables in Vercel.'
      : 'Failed to save journal entry';
    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    );
  }
}
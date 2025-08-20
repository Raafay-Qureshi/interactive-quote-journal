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
  } catch (error) {
    console.error('Failed to fetch journal entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journal entries' },
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
  } catch (error) {
    console.error('Failed to save journal entry:', error);
    return NextResponse.json(
      { error: 'Failed to save journal entry' },
      { status: 500 }
    );
  }
}
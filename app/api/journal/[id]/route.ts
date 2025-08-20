import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/services/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const result = await db
      .collection('journal')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Entry deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Failed to delete journal entry:', error);
    const errorMessage = error.message?.includes('environment variable')
      ? 'Database connection not configured. Please set up MongoDB environment variables in Vercel.'
      : 'Failed to delete journal entry';
    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    );
  }
}
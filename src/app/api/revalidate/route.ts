import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    revalidatePath('/');
    return NextResponse.json({ revalidated: true, timestamp: Date.now() });
  } catch (err) {
    return NextResponse.json({ revalidated: false, error: String(err) }, { status: 500 });
  }
}

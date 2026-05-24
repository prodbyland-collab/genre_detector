import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    shareId: crypto.randomUUID(),
    url: '/s/demo',
  });
}

import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!file.endsWith('.html')) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const filePath = path.join(process.cwd(), 'public', '_mockups', file);
    const html = await readFile(filePath, 'utf-8');
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

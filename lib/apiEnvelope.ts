import { NextResponse } from 'next/server';

/** CSMJU2030 API convention: every REST endpoint responds with this envelope. */
export function envelope<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data, error: null }, { status });
}

export function envelopeError(error: string, status = 400) {
  return NextResponse.json({ success: false, data: null, error }, { status });
}
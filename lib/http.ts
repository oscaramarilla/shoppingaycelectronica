import { NextResponse } from 'next/server';

/** Respuesta JSON consistente para todos los endpoints. */
export function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status });
}

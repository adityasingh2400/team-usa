import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { matchArchetype } from '@/lib/gemini';
import { scanOutput } from '@/lib/compliance';
import { centroidFallback } from '@/lib/fallback';

const QuizAnswersSchema = z.object({
  teamVsSolo:            z.number().min(0).max(1),
  enduranceVsExplosive:  z.number().min(0).max(1),
  precisionVsPower:      z.number().min(0).max(1),
  waterVsLand:           z.number().min(0).max(1),
  strategistVsReactor:   z.number().min(0).max(1),
});

const UserInputSchema = z.object({
  heightCm:      z.number().min(100).max(250),
  weightKg:      z.number().min(30).max(200),
  wingspanCm:    z.number().min(100).max(260).optional(),
  quiz:          QuizAnswersSchema,
  silhouettePng: z.string().optional(),
  webcamDenied:  z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = UserInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const input = parsed.data;

  // Attempt 1 via Gemini (with internal retry + fallback)
  let match = await matchArchetype(input);

  // Compliance scan — if output contains banned phrases, retry once
  const scan = scanOutput(match.narrativeBeats);
  if (!scan.pass) {
    const retry = await matchArchetype(input);
    const retryScan = scanOutput(retry.narrativeBeats);
    match = retryScan.pass ? retry : centroidFallback(input);
  }

  return NextResponse.json(match);
}

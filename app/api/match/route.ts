import { NextResponse } from "next/server";
import { matchArchetype, userInputSchema } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const input = userInputSchema.parse(json);
    const match = await matchArchetype(input);
    return NextResponse.json(match);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to match archetype";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

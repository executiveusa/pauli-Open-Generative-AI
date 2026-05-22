import { NextResponse } from "next/server";
import { generateScenePrompt } from "@/lib/ai-inference/generators";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      section,
      startTime,
      endTime,
      lyrics,
      bpm,
      mood,
      energy,
      characterPassport,
    } = body;

    if (!section || startTime === undefined || endTime === undefined) {
      return NextResponse.json(
        {
          error:
            "section, startTime, and endTime are required",
        },
        { status: 400 }
      );
    }

    const result = await generateScenePrompt(
      section,
      startTime,
      endTime,
      lyrics,
      bpm,
      mood,
      energy,
      characterPassport
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      prompt: result.prompt,
      usage: result.usage,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
}

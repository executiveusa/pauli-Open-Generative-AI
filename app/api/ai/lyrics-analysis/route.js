import { NextResponse } from "next/server";
import { generateLyricsAnalysis } from "@/lib/ai-inference/generators";

export async function POST(request) {
  try {
    const body = await request.json();
    const { lyrics, musicInfo } = body;

    if (!lyrics) {
      return NextResponse.json(
        {
          error: "Lyrics are required",
        },
        { status: 400 }
      );
    }

    const result = await generateLyricsAnalysis(
      lyrics,
      musicInfo || {}
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          rawContent: result.rawContent,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      analysis: result.analysis,
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

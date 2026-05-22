import { NextResponse } from "next/server";
import { generateMusicVideoScript } from "@/lib/ai-inference/generators";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      lyrics,
      characterPassport,
      lyricsAnalysis,
      duration,
    } = body;

    if (!lyrics) {
      return NextResponse.json(
        {
          error: "Lyrics are required",
        },
        { status: 400 }
      );
    }

    const result = await generateMusicVideoScript(
      lyrics,
      characterPassport,
      lyricsAnalysis,
      duration
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
      script: result.script,
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

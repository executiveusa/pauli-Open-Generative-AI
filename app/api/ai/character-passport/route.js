import { NextResponse } from "next/server";
import { generateCharacterPassport } from "@/lib/ai-inference/generators";

export async function POST(request) {
  try {
    const body = await request.json();
    const { description, musicMood } = body;

    if (!description) {
      return NextResponse.json(
        {
          error: "Character description is required",
        },
        { status: 400 }
      );
    }

    const result = await generateCharacterPassport(description, musicMood);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          rawContent: result.rawContent,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
}

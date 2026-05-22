import { NextResponse } from "next/server";
import { healthCheck } from "@/lib/ai-inference";

export async function GET(request) {
  const health = await healthCheck();

  const status = health.healthy ? 200 : 503;
  return NextResponse.json(health, { status });
}

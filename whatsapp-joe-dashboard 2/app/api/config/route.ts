import { NextResponse } from "next/server";
import { mockSettings } from "@/lib/mock-data";

export async function GET() {
  // In production, this would fetch real configuration from your backend
  return NextResponse.json({
    config: mockSettings,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  // In production, this would update the configuration in your backend
  const body = await request.json();

  // Validate the configuration
  if (!body.config) {
    return NextResponse.json(
      { error: "Invalid configuration" },
      { status: 400 }
    );
  }

  // Mock successful update
  return NextResponse.json({
    success: true,
    config: body.config,
    message: "Configuration updated successfully",
    timestamp: new Date().toISOString(),
  });
}

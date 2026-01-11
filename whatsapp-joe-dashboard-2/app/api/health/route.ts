import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "whatsapp-joe-dashboard",
      version: "2.0.1",
    },
    { status: 200 }
  );
}

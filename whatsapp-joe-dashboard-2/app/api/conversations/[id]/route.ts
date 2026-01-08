import { NextResponse } from "next/server";
import { mockConversations, mockConversationMessages } from "@/lib/mock-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const conversation = mockConversations.find((c) => c.id === id);

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  const messages =
    mockConversationMessages[id as keyof typeof mockConversationMessages] || [];

  return NextResponse.json({
    conversation,
    messages,
    timestamp: new Date().toISOString(),
  });
}

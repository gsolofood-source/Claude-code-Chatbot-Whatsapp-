import { NextResponse } from "next/server";
import { mockConversations, mockConversationMessages } from "@/lib/mock-data";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const conversation = mockConversations.find((c) => c.id === params.id);

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  const messages = mockConversationMessages[params.id as keyof typeof mockConversationMessages] || [];

  return NextResponse.json({
    conversation,
    messages,
    timestamp: new Date().toISOString(),
  });
}

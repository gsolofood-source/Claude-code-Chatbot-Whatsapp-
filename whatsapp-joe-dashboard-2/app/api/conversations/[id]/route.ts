import { NextResponse, type NextRequest } from "next/server";
import { mockConversations, mockConversationMessages } from "@/lib/mock-data";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = context.params;

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

import { notFound } from "next/navigation";
import { ChatScreen } from "./ChatScreen";

export default async function ChatPage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  if ((kind !== "d" && kind !== "g") || !/^[A-Za-z0-9]{1,64}$/.test(id)) notFound();
  return <ChatScreen kind={kind} targetId={id} />;
}

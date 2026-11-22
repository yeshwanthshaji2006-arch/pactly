import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { BottomNav } from "@/components/BottomNav";
import { ProfileProvider } from "@/components/ProfileProvider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/auth/signout");
  if (!profile.onboarded) redirect("/onboarding");
  return (
    <ProfileProvider profile={profile}>
      <ChatProvider>
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg sm:border-x sm:border-line sm:shadow-md">
          <div className="flex-1 pb-24">{children}</div>
          <BottomNav />
        </div>
      </ChatProvider>
    </ProfileProvider>
  );
}

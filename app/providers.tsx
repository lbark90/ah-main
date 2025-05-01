"use client";

import { UserProvider } from "../lib/context/UserContext";
import { VoiceProvider } from "../lib/context/VoiceContext";
import { AssistantProvider } from "../lib/context/AssistantContext";
import { InterviewProvider } from "../lib/context/InterviewContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <VoiceProvider>
        <InterviewProvider>
          <AssistantProvider>{children}</AssistantProvider>
        </InterviewProvider>
      </VoiceProvider>
    </UserProvider>
  );
}

import { AuthGuard } from "@/components/auth/auth-guard";
import { ReactNode, Suspense } from "react";
import PulseLoader from "@/components/ui/pulse-loader";

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <PulseLoader />
        </div>
      }
    >
      <AuthGuard>{children}</AuthGuard>
    </Suspense>
  );
}

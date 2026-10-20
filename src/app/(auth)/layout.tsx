import { AuthFrame } from "@/components/auth/auth-shell";

// Sign-in, sign-up and recovery share one frame, so the animated tree doesn't restart between them.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthFrame>{children}</AuthFrame>;
}

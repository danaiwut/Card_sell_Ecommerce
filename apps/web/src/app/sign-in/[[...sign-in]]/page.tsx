import { SignIn } from "@clerk/nextjs";
import { DevLogin } from "@/components/dev-login";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignInPage() {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
      {clerkEnabled ? <SignIn /> : <DevLogin />}
    </div>
  );
}

import { SignUp } from "@clerk/nextjs";
import { DevLogin } from "@/components/dev-login";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignUpPage() {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
      {clerkEnabled ? <SignUp /> : <DevLogin />}
    </div>
  );
}

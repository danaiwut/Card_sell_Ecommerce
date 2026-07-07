import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
      <SignUp />
    </div>
  );
}

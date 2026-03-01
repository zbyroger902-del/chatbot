"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";

const REGISTER_ACTION = "/api/auth/register?redirectUrl=/";

function RegisterContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "user_exists") {
      toast({ type: "error", description: "Account already exists!" });
    } else if (error === "failed") {
      toast({ type: "error", description: "Failed to create account!" });
    } else if (error === "invalid_data") {
      toast({
        type: "error",
        description: "Failed validating your submission!",
      });
    }
  }, [searchParams]);

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="font-semibold text-xl dark:text-zinc-50">Sign Up</h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Create an account with your email and password
          </p>
        </div>
        <AuthForm action={REGISTER_ACTION} defaultEmail="">
          <SubmitButton isSuccessful={false}>Sign Up</SubmitButton>
          <p className="mt-4 text-center text-gray-600 text-sm dark:text-zinc-400">
            {"Already have an account? "}
            <Link
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              href="/login"
            >
              Sign in
            </Link>
            {" instead."}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh w-screen items-center justify-center bg-background">
          <div className="size-8 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}

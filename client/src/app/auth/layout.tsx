"use client";
import useAuthStore from "@/store/authStore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  return <div>{children}</div>;
}

"use client";
import { Geist, Geist_Mono } from "next/font/google";
import useAuthStore from "@/store/authStore";
import { useEffect, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    console.log(user);
    if (!user && !isLoading && router) {
      router.replace("/auth/login");
    }
  }, [user, isLoading, router]);

  return (
    <div>
      <span>logged in as: {user?.email || "N/A"}</span>
      {children}
    </div>
  );
}

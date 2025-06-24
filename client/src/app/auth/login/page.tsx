"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axios";
import useAuthStore from "@/store/authStore";
import { deriveMEK, getAndDecryptDEK } from "@/utils/utils_option_2";
import { base64ToArrayBuffer, bufferToBase64 } from "@/utils/helpers";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { checkAuth } = useAuthStore();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/auth/login", {
        email,
        password,
      });
      const { accessToken, mekSalt, encryptedDEK } = res.data;
      console.log("run");
      if (accessToken && mekSalt) {
        console.log("inside");
        const MEK = await deriveMEK(mekSalt, password);
        const decryptedDEK = await getAndDecryptDEK(
          MEK,
          base64ToArrayBuffer(encryptedDEK)
        );

        localStorage.setItem("DEK", bufferToBase64(decryptedDEK));
        localStorage.setItem("accessToken", accessToken);
        await checkAuth();
        router.push("/");
      } else {
        console.error("No token received.");
        return;
      }
    } catch (error: any) {
      console.error("Login error:", error.response?.data || error.message);
    }
  };

  return (
    <div className="w-full h-full flex justify-center items-center">
      <main className="p-4 w-[600px] h-[600px]">
        <h1 className="text-xl font-bold mb-4">Login</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-2">
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2"
            minLength={8}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2"
            minLength={6}
          />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">
            Login
          </button>
        </form>
        <a href="/auth/register">register here</a>
      </main>
    </div>
  );
}

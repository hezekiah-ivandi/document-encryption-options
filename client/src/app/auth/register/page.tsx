"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axios";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/auth/register", {
        email,
        password,
      });
      console.log(res);
      if (res.status === 200) {
        alert("Register successful");
      }
      router.push("/auth/login");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full h-full flex justify-center items-center">
      <main className="p-4 w-[600px] h-[600px]">
        <h1 className="text-xl font-bold mb-4">Register</h1>
        <form onSubmit={handleRegister} className="flex flex-col gap-2">
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
          <button type="submit" className="bg-green-500 text-white p-2 rounded">
            Register
          </button>
        </form>
        <a href="/auth/login">login here</a>
      </main>
    </div>
  );
}

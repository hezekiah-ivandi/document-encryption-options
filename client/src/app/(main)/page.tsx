"use client";

import useAuthStore from "@/store/authStore";
import {
  decryptAndDownloadFile,
  decryptAndGenerateUrl,
  encryptAndUpload,
} from "@/utils/utils_option_1";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

export default function MainPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-600">
        File Upload
      </h1>
      <button
        className="text-blue-400 cursor-pointer"
        onClick={() => router.push("/option_1")}
      >
        Option 1 Demo
      </button>
      <button
        className="text-blue-400 cursor-pointer"
        onClick={() => router.push("/option_2")}
      >
        Option 2 Demo
      </button>
    </div>
  );
}

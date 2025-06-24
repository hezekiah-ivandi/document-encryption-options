"use client";

import { tokenizedAxios } from "@/lib/axios";
import useAuthStore from "@/store/authStore";
import {
  decryptAndDownloadFile,
  decryptAndGenerateUrl,
  encryptAndUpload,
} from "@/utils/utils_option_1";
import {
  decryptAndDownloadFile2,
  decryptAndGenerateUrl2,
  encryptAndUpload2,
} from "@/utils/utils_option_2";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

export default function UploadTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [fileInfo, setFileInfo] = useState("");
  const [existingFiles, setExistingFiles] = useState<
    {
      id: number;
      originalName: string;
    }[]
  >();
  const [viewFile, setViewFile] = useState("");
  /*
  
  */

  const fetchFiles = async () => {
    try {
      const res = await tokenizedAxios.get("/option_2/files");
      setExistingFiles(res.data.files);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    return () => {
      if (viewFile) {
        URL.revokeObjectURL(viewFile);
      }
    };
  }, [viewFile]);
  /*
    Handle changes, upload * download
  */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);

    if (selectedFile) {
      setFileInfo(
        `Selected: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(
          2
        )} KB)`
      );
    } else {
      setFileInfo("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("❌ No file selected");
      return;
    }
    try {
      await encryptAndUpload2(file);
      setMessage("File uploaded successfully!");
      fetchFiles(); //Refresh
    } catch (error) {
      console.error(error);
      setMessage("Upload failed: " + (error as Error).message);
    }
  };

  const handleDownload = async (fileId: number) => {
    try {
      await decryptAndDownloadFile2(fileId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleView = async (fileId: number) => {
    try {
      const URL = await decryptAndGenerateUrl2(fileId);
      setViewFile(URL);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-100">
      <div className="bg-white shadow-lg rounded p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center text-gray-600">
          Option 2
        </h1>

        {/* File input */}
        <label className="block mb-4">
          <span className="sr-only">Choose file</span>
          <input
            type="file"
            onChange={handleFileChange}
            accept="*/*"
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
            "
          />
        </label>

        {fileInfo && <p className="text-sm text-gray-600 mb-2">{fileInfo}</p>}

        <button
          onClick={handleUpload}
          type="button"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Upload File
        </button>

        {message && <p className="mt-4 text-center text-gray-600">{message}</p>}
      </div>
      {existingFiles && existingFiles.length > 0 && (
        <div className="mt-6 w-full flex items-center justify-center flex-col">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Uploaded Files:
          </h2>
          <ul className="text-gray-600 space-y-1">
            {existingFiles.map((file) => (
              <li key={file.id}>
                <div className="flex gap-3">
                  <p>{file.originalName}</p>
                  <button
                    className="text-blue-400 cursor-pointer"
                    onClick={() => handleView(file.id)}
                  >
                    View
                  </button>
                  <button
                    className="text-blue-400 cursor-pointer"
                    onClick={() => handleDownload(file.id)}
                  >
                    Download
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {viewFile && (
        <div className="mt-6 w-full max-w-4xl">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            File Preview:
          </h2>
          <iframe
            src={viewFile}
            title="Decrypted File Preview"
            className="w-full h-[600px] border rounded shadow"
          ></iframe>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";

interface UploadResult {
  success: boolean;
  message: string;
  count?: number;
  errors?: string[];
}

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      setFile(droppedFile);
      setResult(null);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResult(data);
      if (data.success) {
        setFile(null);
        router.refresh();
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Upload failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Upload WordPress Customers</h1>
        <p className="text-slate-600 mt-1">
          Import your WordPress customer CSV file into the retargeting database.
        </p>
      </div>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Expected CSV Format</h2>
        <p className="text-sm text-slate-600 mb-4">
          The CSV should have these columns: <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">email</code>,{" "}
          <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">phone</code>,{" "}
          <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">first_name</code>,{" "}
          <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">last_name</code>,{" "}
          <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">ct</code>,{" "}
          <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">value</code>
        </p>
        <div className="bg-slate-50 rounded-md p-3 text-xs text-slate-600 font-mono">
          email,phone,first_name,last_name,ct,value
          <br />
          user@example.com,923001234567,John,Doe,Karachi,15000.00
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragOver
            ? "border-orange-400 bg-orange-50"
            : "border-slate-300 bg-white hover:border-slate-400"
        }`}
      >
        {file ? (
          <div className="space-y-2">
            <FileSpreadsheet className="w-10 h-10 text-green-600 mx-auto" />
            <p className="font-medium text-slate-900">{file.name}</p>
            <p className="text-sm text-slate-500">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <button
              onClick={() => setFile(null)}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-10 h-10 text-slate-400 mx-auto" />
            <div>
              <p className="font-medium text-slate-900">
                Drag and drop your CSV file here
              </p>
              <p className="text-sm text-slate-500 mt-1">or click to browse</p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        )}
      </div>

      {file && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="mt-4 w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? "Uploading..." : `Upload ${file.name}`}
        </button>
      )}

      {/* Result */}
      {result && (
        <div
          className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${
            result.success
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          )}
          <div>
            <p
              className={`font-medium ${
                result.success ? "text-green-800" : "text-red-800"
              }`}
            >
              {result.message}
            </p>
            {result.count !== undefined && (
              <p className="text-sm text-green-700 mt-1">
                {result.count} customers imported successfully.
              </p>
            )}
            {result.errors && result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-red-700">Errors:</p>
                <ul className="text-xs text-red-600 mt-1 space-y-1">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {result.errors.length > 10 && (
                    <li>...and {result.errors.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

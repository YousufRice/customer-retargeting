"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Target, LogIn } from "lucide-react";
import { appwriteAccount } from "@/lib/appwrite-auth";

const ALLOWED_AGENTS = ["saima", "kiran"];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await appwriteAccount.createEmailPasswordSession(email, password);
      const account = await appwriteAccount.get();
      const labels = (account.labels || []).map((l: string) =>
        l.toLowerCase().trim(),
      );
      const matchedLabel = labels.find((l: string) =>
        ALLOWED_AGENTS.includes(l),
      );
      if (!matchedLabel) {
        await appwriteAccount.deleteSession("current");
        setError("Access denied. Only authorized agents can log in.");
        return;
      }
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: matchedLabel }),
      });
      if (!res.ok) {
        setError("Session setup failed.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white border rounded-xl shadow-sm p-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Target className="w-8 h-8 text-orange-500" />
          <h1 className="text-2xl font-bold text-slate-900">Retargeting</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="agent@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

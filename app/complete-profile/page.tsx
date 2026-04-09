"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export default function CompleteProfilePage() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [childName, setChildName] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUid(user.uid);

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          router.push("/signup");
          return;
        }

        const data = snap.data() as any;

        if (data.accountType === "ustad" || data.role === "admin" || data.role === "pending_admin") {
          router.push("/");
          return;
        }

        if (data.profileCompleted === true) {
          router.push("/");
          return;
        }

        setParentName(data.username || "");
        setParentPhone(data.phone || "");
      } catch {
        setErr("Could not load your profile details.");
      } finally {
        setChecking(false);
      }
    });

    return () => unsub();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;

    setErr(null);
    setLoading(true);

    try {
      await setDoc(
        doc(db, "users", uid),
        {
          childName: childName.trim(),
          parentName: parentName.trim(),
          parentPhone: parentPhone.trim(),
          profileCompleted: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      router.push("/");
    } catch {
      setErr("Could not save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#F8F6F1] text-gray-700">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F6F1] px-6 py-10">
      <div className="max-w-xl mx-auto rounded-3xl border border-gray-300 bg-white/80 backdrop-blur p-8 shadow-lg">
        <p className="uppercase tracking-widest text-xs text-[#B8963D]">
          Complete Profile
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Add child details
        </h1>

        <p className="mt-3 text-sm text-gray-600">
          Please complete the child and parent information before continuing.
        </p>

        {err && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <div>
            <label className="text-sm font-medium text-gray-800">
              Child's Name
            </label>
            <input
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              type="text"
              required
              placeholder="e.g. Muhammad Ahmed"
              className="mt-2 w-full h-12 rounded-2xl border border-gray-300 bg-white px-4 outline-none focus:ring-2 focus:ring-[#B8963D]/40"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-800">
              Parent's Name
            </label>
            <input
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              type="text"
              required
              placeholder="e.g. Ahmed Khan"
              className="mt-2 w-full h-12 rounded-2xl border border-gray-300 bg-white px-4 outline-none focus:ring-2 focus:ring-[#B8963D]/40"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-800">
              Parent's Phone Number
            </label>
            <input
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              type="tel"
              required
              placeholder="e.g. 082 123 4567"
              className="mt-2 w-full h-12 rounded-2xl border border-gray-300 bg-white px-4 outline-none focus:ring-2 focus:ring-[#B8963D]/40"
            />
          </div>

          <button
            disabled={loading}
            className="mt-2 h-12 rounded-2xl bg-black text-white font-semibold hover:bg-gray-900 transition-colors shadow-sm disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save and Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
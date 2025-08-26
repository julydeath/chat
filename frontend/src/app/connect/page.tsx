"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Connect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/connect/global");
  }, [router]);
  return null;
}

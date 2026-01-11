"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CockpitView() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/cockpit/dashboard");
  }, [router]);

  return null;
}

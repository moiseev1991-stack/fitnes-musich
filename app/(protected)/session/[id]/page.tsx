"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { SessionEditor } from "@/components/session/SessionEditor";

interface SessionData {
  id: string;
  date: string | null;
  title: string | null;
  sessionExercises: {
    id: string;
    exerciseId: string;
    exercise: { id: string; name: string };
    plannedSets: number;
    sets: { id: string; weight: number; reps: number; note: string | null }[];
  }[];
}

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (!res.ok) {
        if (res.status === 404) router.push("/calendar");
        return;
      }
      const data = await res.json();
      setSession(data.session);
    } catch {
      router.push("/calendar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [id]);

  if (loading || !session) {
    return (
      <MobileLayout>
        <div className="py-8 text-center text-slate-500">Загрузка...</div>
      </MobileLayout>
    );
  }

  const isTemplate = session.date === null;

  return (
    <MobileLayout>
      <SessionEditor
        session={session}
        isTemplate={isTemplate}
        onBack={() => router.push(isTemplate ? "/templates" : "/calendar")}
        onRefresh={fetchSession}
        onSessionDeleted={(dateStr) => {
          if (isTemplate) router.push("/templates");
          else if (dateStr) router.push(`/calendar?deleted=${dateStr}`);
        }}
      />
    </MobileLayout>
  );
}

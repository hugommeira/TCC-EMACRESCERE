import type { Metadata }  from "next";
import { notFound, redirect } from "next/navigation";
import { auth }           from "@/lib/auth";
import { getConsultationById } from "@/services/api/consultation";
import { ChatWindow }     from "@/components/chat/ChatWindow";

export const metadata: Metadata = { title: "Sala de consulta" };

interface Props {
  params: { id: string };
}

export default async function PatientChatPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  let consultation;
  try {
    consultation = await getConsultationById(params.id, session.user.id);
  } catch {
    notFound();
  }

  if (!consultation.roomToken) notFound();

  if (
    consultation.status !== "IN_PROGRESS" &&
    consultation.status !== "WAITING"
  ) {
    redirect(`/dashboard/patient/consultations/${params.id}`);
  }

  const doctor      = consultation.doctor;
  const otherName   = doctor.name;

  return (
    <div className="h-[calc(100vh-4rem)] p-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <a
          href={`/dashboard/patient/consultations/${params.id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Detalhes
        </a>
        <span className="text-sm text-gray-400">/</span>
        <span className="text-sm font-medium text-gray-900">Sala de consulta</span>
      </div>

      <div className="flex-1 min-h-0">
        <ChatWindow
          consultationId={consultation.id}
          roomToken={consultation.roomToken}
          currentUserId={session.user.id}
          currentUserName={session.user.name}
          otherUserName={otherName}
        />
      </div>
    </div>
  );
}

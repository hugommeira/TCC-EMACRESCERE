import { redirect } from "next/navigation";
import { auth }     from "@/lib/auth";
import type { Role } from "@prisma/client";
import { Header }       from "@/components/landing/Header";
import { TrustBar }     from "@/components/landing/TrustBar";
import { Hero }         from "@/components/landing/Hero";
import { HowItWorks }   from "@/components/landing/HowItWorks";
import { Benefits }     from "@/components/landing/Benefits";
import { ForWhom }      from "@/components/landing/ForWhom";
import { Testimonials } from "@/components/landing/Testimonials";
import { Faq }          from "@/components/landing/Faq";
import { CtaFinal }     from "@/components/landing/CtaFinal";
import { Footer }       from "@/components/landing/Footer";

const roleRedirect: Record<Role, string> = {
  PATIENT:    "/dashboard/patient",
  DOCTOR:     "/dashboard/doctor",
  ADMIN:      "/dashboard/admin",
  SUPER_ADMIN: "/dashboard/admin",
};

export default async function RootPage() {
  const session = await auth();

  if (session?.user) {
    redirect(roleRedirect[session.user.role]);
  }

  return (
    <main className="overflow-x-hidden bg-white text-slate-900">
      <Header />
      <Hero />
      <TrustBar />
      <HowItWorks />
      <Benefits />
      <ForWhom />
      <Testimonials />
      <Faq />
      <CtaFinal />
      <Footer />
    </main>
  );
}

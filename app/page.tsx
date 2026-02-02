import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.has("fitness_session");

  if (hasSession) {
    redirect("/calendar");
  }
  redirect("/login");
}

import { redirect } from "next/navigation";

export const instant = false;

type Props = { searchParams: Promise<{ error?: string; message?: string }> };

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { error, message } = await searchParams;
  const query = new URLSearchParams({ authMode: "forgot" });
  if (error) query.set("error", error);
  if (message) query.set("message", message);
  redirect(`/?${query.toString()}`);
}

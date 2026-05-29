import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { name, email, company, uploadsPerMonth, message } = await request.json();

  if (!name || !email || !uploadsPerMonth) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: "drrop.io <onboarding@resend.dev>",
    to: "shimal@drrop.io",
    replyTo: email,
    subject: `Agency Max inquiry from ${name}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      company ? `Company: ${company}` : null,
      `Uploads per month: ${uploadsPerMonth}`,
      message ? `\nMessage:\n${message}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  if (error) {
    console.error("[inquire] Resend error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

import { Resend } from "resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const { name, email, msg } = await request.json();

  if (!name || !email || !msg || !EMAIL_RE.test(email)) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "jeapitz360@gmail.com",
      subject: `Nuevo mensaje de contacto de ${name}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\n${msg}`,
    });

    if (error) {
      return Response.json({ error: "Failed to send" }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Failed to send" }, { status: 500 });
  }
}

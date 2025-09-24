import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'npm:resend@2.0.0'

serve(async (req) => {
  const { student, assignment, reason } = await req.json()

  const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

  await resend.emails.send({
    from: Deno.env.get('RESEND_FROM'),
    to: Deno.env.get('PARENT_EMAIL'),
    subject: `${student} is stuck on assignment`,
    html: `
      <h2>Student Needs Help</h2>
      <p><strong>Student:</strong> ${student}</p>
      <p><strong>Assignment:</strong> ${assignment}</p>
      <p><strong>Issue:</strong> ${reason}</p>
    `
  })

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  try {
    const { student, assignment, reason } = await req.json()
    
    // TODO: Implement email notification functionality
    // This requires proper Resend configuration
    console.log('Stuck notification received:', { student, assignment, reason })
    
    return new Response(JSON.stringify({ success: true, message: 'Notification logged' }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in stuck notification function:', error)
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Canvas sync request received, method:', req.method);
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Parsed request body:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { studentId } = requestBody;
    console.log('Extracted studentId:', studentId, 'Type:', typeof studentId);
    
    if (!studentId) {
      console.error('No studentId provided in request');
      console.log('Request body keys:', Object.keys(requestBody || {}));
      return new Response(JSON.stringify({ error: 'Student ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Syncing Canvas for student:', studentId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine which Canvas instances to sync based on student
    const instances = studentId === 'ab0d7c00-fa89-4d56-994a-7038f8d2ff6b' 
      ? [{ 
          tokenKey: 'KHALIL_CANVAS_TOKEN', 
          urlKey: 'CANVAS_BASE_URL',
          instanceId: 1,
          name: 'Khalil-Main'
        }]
      : [
          { 
            tokenKey: 'ABIGAIL_CANVAS_TOKEN', 
            urlKey: 'CANVAS_BASE_URL',
            instanceId: 1,
            name: 'Abigail-Main'
          },
          { 
            tokenKey: 'ABIGAIL_CANVAS_TOKEN_2', 
            urlKey: 'CANVAS_BASE_URL_2',
            instanceId: 2,
            name: 'Abigail-Secondary'
          }
        ];

    let totalSynced = 0;
    const results = [];

    for (const instance of instances) {
      const token = Deno.env.get(instance.tokenKey);
      const baseCanvasUrl = Deno.env.get(instance.urlKey);
      
      if (!token || !baseCanvasUrl) {
        console.log(`Skipping instance ${instance.name}: Missing token or URL`);
        results.push({ 
          instance: instance.name, 
          success: false, 
          error: 'Missing credentials',
          synced: 0 
        });
        continue;
      }

      console.log(`Syncing Canvas instance: ${instance.name} for student: ${studentId}`);
      
      try {
        const baseUrl = `${baseCanvasUrl}/api/v1`;
        const synced = await syncCanvasInstance(supabase, token, baseUrl, studentId, instance.instanceId, instance.name);
        totalSynced += synced;
        results.push({ 
          instance: instance.name, 
          success: true, 
          synced 
        });
      } catch (error) {
        console.error(`Error syncing ${instance.name}:`, error);
        results.push({ 
          instance: instance.name, 
          success: false, 
          error: error instanceof Error ? error.message : String(error),
          synced: 0 
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Canvas sync completed',
      totalSynced, 
      results 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-canvas function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function syncCanvasInstance(supabase: any, apiToken: string, baseUrl: string, studentId: string, instanceId: number, instanceName: string): Promise<number> {
  let totalSynced = 0;

  // Get active courses
  const coursesResponse = await fetch(`${baseUrl}/courses?enrollment_state=active&per_page=100`, {
    headers: { 'Authorization': `Bearer ${apiToken}` }
  });
  
  if (!coursesResponse.ok) {
    throw new Error(`Failed to fetch courses: ${coursesResponse.status}`);
  }
  
  const courses = await coursesResponse.json();
  console.log(`Found ${courses.length} active courses for ${instanceName}`);

  for (const course of courses) {
    // Get assignments for this course
    const assignmentsResponse = await fetch(`${baseUrl}/courses/${course.id}/assignments?per_page=100`, {
      headers: { 'Authorization': `Bearer ${apiToken}` }
    });
    
    if (!assignmentsResponse.ok) {
      console.error(`Failed to fetch assignments for course ${course.id}`);
      continue;
    }
    
    const assignments = await assignmentsResponse.json();
    
    for (const assignment of assignments) {
      // Skip assignments without due dates or older than 30 days
      if (!assignment.due_at) continue;
      
      const dueDate = new Date(assignment.due_at);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (dueDate < thirtyDaysAgo) continue;

      // Check if assignment already exists for this student and instance
      const { data: existing } = await supabase
        .from('assignments')
        .select('id, completion_status')
        .eq('canvas_id', assignment.id)
        .eq('user_id', studentId)
        .eq('canvas_instance', instanceId)
        .maybeSingle();

      if (existing) {
        // Update existing but DON'T change completion_status
        const { error: updateError } = await supabase
          .from('assignments')
          .update({
            title: assignment.name,
            due_date: assignment.due_at,
            canvas_url: assignment.html_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
          
        if (updateError) {
          console.error('Error updating assignment:', updateError);
        } else {
          console.log(`Updated existing assignment: ${assignment.name}`);
        }
      } else {
        // Create new assignment
        const { error: insertError } = await supabase
          .from('assignments')
          .insert({
            user_id: studentId,
            canvas_id: assignment.id,
            canvas_course_id: course.id,
            canvas_instance: instanceId,
            title: assignment.name,
            subject: course.name,
            course_name: course.course_code,
            instructions: assignment.description?.substring(0, 500),
            due_date: assignment.due_at,
            canvas_url: assignment.html_url,
            submission_types: assignment.submission_types || [],
            points_value: assignment.points_possible,
            is_canvas_import: true,
            creation_source: 'canvas',
            completion_status: 'pending'
          });
          
        if (insertError) {
          console.error('Error inserting assignment:', insertError);
        } else {
          console.log(`Created new assignment: ${assignment.name}`);
        }
      }
      
      totalSynced++;
    }
  }

  return totalSynced;
}
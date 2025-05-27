import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import { z } from "npm:zod@3.22.4";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_PROJECT_URL = Deno.env.get('SUPABASE_PROJECT_URL')!;
const SERVICE_API_KEY = Deno.env.get('SERVICE_API_KEY')!;

const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/task-callback`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

console.log(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_PROJECT_URL, SERVICE_API_KEY);
// Input validation schemas
const textInputSchema = z.object({
  text: z.string().min(1)
});

const serviceRequestSchema = z.object({
  // Base service request fields
  userId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  serviceId: z.string().uuid(),
  inputData: textInputSchema,
  documentUrls: z.array(z.string().url()).optional(),
  serviceUrl: z.string().url(),
  
  // Optional fields that will be added by the function
  documentIds: z.array(z.string().uuid()).optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    // Validate request body
    const body = await req.json();
    const result = serviceRequestSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data', details: result.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = result.data;

    // Create task record in Supabase
    const { data: task, error: insertError } = await supabase
      .from('transactions')
      .insert({
        user_id: data.userId,
        project_id: data.projectId,
        service_id: data.serviceId,
        input_data: data.inputData,
        input_document_urls: data.documentUrls || [],
        status: 'pending',
        task_type: 'task',
        resources_used: {},
        resources_used_count: 0,
        resources_used_cost: 0,
        resource_type: 'llm'
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create task: ${insertError.message}`);
    }
    console.log("Successfully created task", task);
    // Transform data for external service
    const externalRequest = {
      // Base service request fields
      userId: data.userId,
      projectId: data.projectId || task.id,
      serviceId: data.serviceId,
      inputData: data.inputData,
      documentUrls: data.documentUrls || [],
      serviceUrl: data.serviceUrl,
      
      // Task specific fields
      parent_transaction_id: task.id,
      task_type: "task",
      
      // Additional metadata
      metadata: {},
      callback_url: callbackUrl
    }

    // Log the request for debugging
    console.log('External request payload:', JSON.stringify(externalRequest, null, 2));

    // Call external service
    const maxRetries = 3;
    const timeout = 30000; // 30 seconds
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        console.log("Calling external service", data.serviceUrl);
        const response = await fetch(data.serviceUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(externalRequest),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`External service error (attempt ${attempt}/${maxRetries}): ${errorData.message}`);
        }

        // Update task status
        await supabase
          .from('transactions')
          .update({ status: 'processing' })
          .eq('id', task.id);

        return new Response(
          JSON.stringify({ success: true, taskId: task.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        lastError = error;
        
        // If it's the last attempt, update task status to failed
        if (attempt === maxRetries) {
          await supabase
            .from('transactions')
            .update({ 
              status: 'failed',
              error: `Failed after ${maxRetries} attempts: ${error.message}`
            })
            .eq('id', task.id);
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw new Error(`Failed to process task after ${maxRetries} attempts: ${lastError.message}`);
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
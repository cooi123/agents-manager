import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import { z } from "npm:zod@3.22.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_PROJECT_URL = Deno.env.get('SUPABASE_PROJECT_URL')!;
const SERVICE_API_KEY = Deno.env.get('SERVICE_API_KEY')!;


// Result validation schema
const taskResultSchema = z.object({
  result_payload: z.record(z.unknown()).default({}),
  result_document_urls: z.array(z.string().url()).nullable().default(null),
  error_message: z.string().nullable().default(null),
  token_usage: z.record(z.unknown()).nullable().default(null),
  computational_usage: z.record(z.unknown()).nullable().default(null),
  task_status: z.enum(['received', 'pending','running','completed', 'failed', 'processing']),
  parent_transaction_id: z.string().uuid()
});
const taskResultType = z.infer<typeof taskResultSchema>;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    // Validate callback payload
    const body = await req.json();
    const result = taskResultSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid callback data', details: result.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = result.data;
    const taskId = data.parent_transaction_id;
    console.log("Received callback", data);
    console.log("updating task", taskId);

    // First check if task exists
    const { data: existingTask, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', taskId)
      .single();

    if (fetchError) {
      console.error('Error fetching task:', fetchError);
      throw new Error(`Task not found: ${fetchError.message}`);
    }

    console.log('Existing task:', existingTask);

    // Create update data dictionary
    const updateData: Record<string, any> = {
      status: data.task_status,
      updated_at: new Date().toISOString()
    };

    // Add optional fields if they exist
    if (data.result_payload !== null && data.result_payload !== undefined) {
      console.log("result_payload", data.result_payload);
      updateData.result_payload = data.result_payload;
    }
    if (data.result_document_urls !== null && data.result_document_urls !== undefined) {
      updateData.result_document_urls = data.result_document_urls;
    }
    if (data.error_message !== null && data.error_message !== undefined) {
      updateData.error_message = data.error_message;
    }

    // Handle token usage metrics
    if (data.token_usage) {
      try {
        updateData.prompt_tokens = data.token_usage.prompt_tokens;
        updateData.completion_tokens = data.token_usage.completion_tokens;
        updateData.tokens_total = data.token_usage.tokens_total;
        updateData.model_name = data.token_usage.model_name;
      } catch (error) {
        console.error('Error processing token usage metrics:', error);
        throw new Error(`Error processing token usage metrics: ${error.message}`);
      }
    }

    // Handle computation usage metrics
    if (data.computational_usage) {
      try {
        updateData.runtime_ms = data.computational_usage.runtime_ms;
        updateData.resources_used = data.computational_usage.resources_used || {};
      } catch (error) {
        console.error('Error processing computation usage metrics:', error);
        throw new Error(`Error processing computation usage metrics: ${error.message}`);
      }
    }

    console.log('Update data:', updateData);

    // Update the transaction
    const { data: updatedTransaction, error: updateError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      throw new Error(`Failed to update transaction: ${updateError.message}`);
    }

    if (!updatedTransaction) {
      throw new Error(`Transaction ${taskId} not found or no data returned after update`);
    }

    return new Response(
      JSON.stringify({ success: true, data: updatedTransaction }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
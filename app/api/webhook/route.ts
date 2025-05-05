import { sendWebhook } from 'lib/webhooks/sendWebhook';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Webhook received with data:", data);

    const result = await sendWebhook(data);

    return new Response(JSON.stringify({
      message: result.success ? "Webhook processed successfully" : "Failed to process webhook",
      details: result
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

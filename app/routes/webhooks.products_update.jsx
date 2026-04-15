import { authenticate } from "../shopify.server.js";

export const action = async ({ request }) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log(`[Webhook] Received ${topic} for shop: ${shop}`);
  console.log(`[Webhook] Payload:`, JSON.stringify(payload, null, 2));

  // Add your business logic here, e.g. update DB

  return new Response(null, { status: 200 });
};
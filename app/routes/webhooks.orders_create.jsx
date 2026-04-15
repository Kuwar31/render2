import { authenticate } from "../shopify.server.js";

export const action = async ({ request }) => {
  const { topic, shop, payload, admin } = await authenticate.webhook(request);

  console.log(`[Webhook] Received ${topic} for shop: ${shop}`);

  const order = payload;
  const customerId = order.customer?.id;
  const orderTotal = parseFloat(order.total_price || "0");

  if (!customerId) {
    console.log("[Webhook] No customer attached to order, skipping.");
    return new Response(null, { status: 200 });
  }

  const customerGid = `gid://shopify/Customer/${customerId}`;

  // Step 1: Get existing metafield value
  const getResponse = await admin.graphql(
    `#graphql
    query getCustomerMetafield($id: ID!) {
      customer(id: $id) {
        metafield(namespace: "custom", key: "total_spent") {
          id
          value
        }
      }
    }`,
    { variables: { id: customerGid } }
  );

  const getData = await getResponse.json();
  const existingMetafield = getData.data.customer?.metafield;
  const previousTotal = parseFloat(existingMetafield?.value || "0");
  const newTotal = previousTotal + orderTotal;

  console.log(`[Webhook] Customer ${customerId}: ${previousTotal} + ${orderTotal} = ${newTotal}`);

  // Step 2: Upsert the metafield
  const setResponse = await admin.graphql(
    `#graphql
    mutation setMetafield($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        metafields: [
          {
            ownerId: customerGid,
            namespace: "custom",
            key: "total_spent",
            value: newTotal.toString(),
            type: "number_decimal",
          },
        ],
      },
    }
  );

  const setData = await setResponse.json();
  const errors = setData.data.metafieldsSet?.userErrors;

  if (errors?.length > 0) {
    console.error("[Webhook] Metafield error:", errors);
  } else {
    console.log(`[Webhook] Updated total_spent to ${newTotal} for customer ${customerId}`);
  }

  return new Response(null, { status: 200 });
};

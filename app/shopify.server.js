import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { ApiVersion, shopifyApp } from "@shopify/shopify-app-react-router/server";
import prisma from "./db.server.js";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  appUrl: process.env.SHOPIFY_APP_URL,
  apiVersion: ApiVersion.July25,
  sessionStorage: new PrismaSessionStorage(prisma),
  webhooks: {
    ORDERS_CREATE: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks/orders_create",
    },
    PRODUCTS_UPDATE: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks/products_update",
    },
  },
  hooks: {
    afterAuth: async ({ session, admin }) => {
      await shopify.registerWebhooks({ session });

      // Auto-create metafield definition on install
      const response = await admin.graphql(
        `#graphql
        mutation createMetafieldDefinition($definition: MetafieldDefinitionInput!) {
          metafieldDefinitionCreate(definition: $definition) {
            createdDefinition {
              id
              name
              key
            }
            userErrors {
              field
              message
            }
          }
        }`,
        {
          variables: {
            definition: {
              name: "Total Spent",
              namespace: "custom",
              key: "total_spent",
              type: "number_decimal",
              ownerType: "CUSTOMER",
            },
          },
        }
      );

      const data = await response.json();
      const errors = data.data.metafieldDefinitionCreate?.userErrors;

      if (errors?.length > 0) {
        console.log("[afterAuth] Metafield definition already exists or error:", errors);
      } else {
        console.log("[afterAuth] Metafield definition created successfully");
      }
    },
  },
});

export default shopify;
export const authenticate = shopify.authenticate;
export const sessionStorage = shopify.sessionStorage;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const login = shopify.login;
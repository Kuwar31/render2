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
    afterAuth: async ({ session }) => {
      await shopify.registerWebhooks({ session });
    },
  },
});

export default shopify;
export const authenticate = shopify.authenticate;
export const sessionStorage = shopify.sessionStorage;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const login = shopify.login;
import { useLoaderData, useNavigate } from "react-router";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server.js";
import prisma from "../db.server.js";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  
  const bundles = await prisma.bundle.findMany({
    where: { shop },
    include: { tiers: true },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = bundles.reduce((sum, b) => sum + b.revenue, 0);
  const totalOrders = bundles.reduce((sum, b) => sum + b.orders, 0);
  const activeBundles = bundles.filter(b => b.status === "active").length;

  return { totalRevenue, totalOrders, activeBundles, bundles };
};
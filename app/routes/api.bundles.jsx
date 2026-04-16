import prisma from "../db.server.js";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const shop = url.searchParams.get("shop");

  if (!shop) return Response.json({ bundles: [] });

  const bundles = await prisma.bundle.findMany({
    where: {
      shop,
      status: "active",
      OR: [
        { targetType: "all" },
        { targetType: "product", targetId: `gid://shopify/Product/${productId}` },
      ],
    },
    include: { tiers: { orderBy: { position: "asc" } } },
  });

  return Response.json({ bundles }, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
};
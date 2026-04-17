export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  // Temporary: get function ID
  const functionsResponse = await admin.graphql(`
    query {
      shopifyFunctions(first: 10) {
        nodes {
          id
          title
          apiType
        }
      }
    }
  `);
  const functionsData = await functionsResponse.json();
  console.log("[Functions]", JSON.stringify(functionsData.data, null, 2));

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
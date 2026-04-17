import { useLoaderData, useNavigate } from "react-router";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server.js";
import prisma from "../db.server.js";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
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

export default function Dashboard() {
  const { totalRevenue, totalOrders, activeBundles, bundles } = useLoaderData();
  const navigate = useNavigate();

  return (
    <s-page>
      <TitleBar title="Kaching Bundles" />
      <s-section heading="Overview">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
          <button
            onClick={() => navigate("/app/bundles/new")}
            style={{ padding: "10px 20px", background: "#008060", color: "white", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px" }}
          >
            Create bundle
          </button>
        </div>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "150px", background: "#f0f8ff", borderRadius: "8px", padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: "700" }}>${totalRevenue.toFixed(2)}</div>
            <div style={{ color: "#666", marginTop: "4px" }}>Extra Revenue</div>
          </div>
          <div style={{ flex: 1, minWidth: "150px", background: "#f0fff0", borderRadius: "8px", padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: "700" }}>{totalOrders}</div>
            <div style={{ color: "#666", marginTop: "4px" }}>Bundle Orders</div>
          </div>
          <div style={{ flex: 1, minWidth: "150px", background: "#fff8f0", borderRadius: "8px", padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: "700" }}>{activeBundles}</div>
            <div style={{ color: "#666", marginTop: "4px" }}>Active Bundles</div>
          </div>
        </div>
      </s-section>
      <s-section heading="Recent Bundles">
        {bundles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p>No bundles yet.</p>
            <button
              onClick={() => navigate("/app/bundles/new")}
              style={{ padding: "10px 20px", background: "#008060", color: "white", borderRadius: "6px", border: "none", cursor: "pointer" }}
            >
              Create your first bundle
            </button>
          </div>
        ) : (
          bundles.slice(0, 5).map(b => (
            <div key={b.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #e0e0e0" }}>
              <div>
                <strong>{b.title}</strong>
                <div style={{ fontSize: "13px", color: "#666" }}>{b.tiers.length} tiers — {b.targetType}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ color: b.status === "active" ? "#008060" : "#666" }}>
                  {b.status === "active" ? "● Active" : "○ Paused"}
                </span>
                <button
                  onClick={() => navigate(`/app/bundles/${b.id}`)}
                  style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer", background: "white" }}
                >
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </s-section>
    </s-page>
  );
}
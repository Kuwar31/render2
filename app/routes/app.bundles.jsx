import { useLoaderData, useSubmit, Link } from "react-router";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server.js";
import prisma from "../db.server.js";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const bundles = await prisma.bundle.findMany({
    where: { shop: session.shop },
    include: { tiers: true },
    orderBy: { createdAt: "desc" },
  });
  return { bundles };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const id = formData.get("id");
  const intent = formData.get("intent");

  if (intent === "delete") {
    await prisma.bundle.delete({ where: { id, shop: session.shop } });
  } else if (intent === "toggle") {
    const bundle = await prisma.bundle.findUnique({ where: { id } });
    await prisma.bundle.update({
      where: { id },
      data: { status: bundle.status === "active" ? "paused" : "active" },
    });
  }
  return null;
};

export default function BundleList() {
  const { bundles } = useLoaderData();
  const submit = useSubmit();

  const handleToggle = (id) => {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("intent", "toggle");
    submit(formData, { method: "post" });
  };

  const handleDelete = (id) => {
    if (!confirm("Delete this bundle?")) return;
    const formData = new FormData();
    formData.append("id", id);
    formData.append("intent", "delete");
    submit(formData, { method: "post" });
  };

  return (
    <s-page>
      <TitleBar title="Bundles" />

      <s-section>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
          <Link to="/app/bundles/new" style={{ padding: "10px 20px", background: "#008060", color: "white", borderRadius: "6px", textDecoration: "none", fontSize: "14px" }}>
            Create bundle
          </Link>
        </div>

        {bundles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p>No bundles yet.</p>
            <Link to="/app/bundles/new" style={{ padding: "10px 20px", background: "#008060", color: "white", borderRadius: "6px", textDecoration: "none" }}>
              Create your first bundle
            </Link>
          </div>
        ) : (
          bundles.map(b => (
            <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid #e0e0e0" }}>
              <div>
                <strong>{b.title}</strong>
                <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                  {b.tiers.length} tiers · {b.targetType === "all" ? "All products" : b.targetType} · ${b.revenue.toFixed(2)} revenue
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ color: b.status === "active" ? "#008060" : "#999", fontSize: "13px" }}>
                  {b.status === "active" ? "● Active" : "○ Paused"}
                </span>
                <button onClick={() => handleToggle(b.id)} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}>
                  {b.status === "active" ? "Pause" : "Activate"}
                </button>
                <Link to={`/app/bundles/${b.id}`} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: "4px", textDecoration: "none", color: "#333" }}>
                  Edit
                </Link>
                <button onClick={() => handleDelete(b.id)} style={{ padding: "6px 12px", border: "1px solid #fcc", borderRadius: "4px", cursor: "pointer", color: "#d00" }}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </s-section>
    </s-page>
  );
}
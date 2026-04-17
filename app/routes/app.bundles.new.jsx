import { useState } from "react";
import { useSubmit, useActionData } from "react-router";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server.js";
import prisma from "../db.server.js";
import { redirect } from "react-router";

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();

  const title = formData.get("title");
  const targetType = formData.get("targetType");
  const targetId = formData.get("targetId") || null;
  const layout = formData.get("layout") || "classic";
  const tiers = JSON.parse(formData.get("tiers") || "[]");

  if (!title) return { error: "Title is required" };
  if (tiers.length === 0) return { error: "Add at least one tier" };

  const bundle = await prisma.bundle.create({
    data: {
      shop: session.shop,
      title,
      targetType,
      targetId,
      layout,
      tiers: {
        create: tiers.map((t, i) => ({
          quantity: parseInt(t.quantity),
          discountType: t.discountType,
          discountValue: parseFloat(t.discountValue),
          label: t.label || null,
          position: i,
        })),
      },
    },
  });

  if (process.env.SHOPIFY_FUNCTION_ID) {
    const discountResponse = await admin.graphql(
      `#graphql
      mutation discountCreate($discount: DiscountAutomaticAppInput!) {
        discountAutomaticAppCreate(automaticAppDiscount: $discount) {
          automaticAppDiscount {
            discountId
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          discount: {
            title: title,
            functionId: process.env.SHOPIFY_FUNCTION_ID,
            startsAt: new Date().toISOString(),
            metafields: [
              {
                namespace: "$app:bundle-function",
                key: "function-configuration",
                type: "json",
                value: JSON.stringify({ tiers }),
              },
            ],
          },
        },
      }
    );

    const discountData = await discountResponse.json();
    const discountId = discountData.data?.discountAutomaticAppCreate?.automaticAppDiscount?.discountId;
    const errors = discountData.data?.discountAutomaticAppCreate?.userErrors;

    if (errors?.length > 0) {
      console.error("[Bundle] Discount creation errors:", errors);
    } else if (discountId) {
      await prisma.bundle.update({
        where: { id: bundle.id },
        data: { discountId },
      });
    }
  } else {
    console.warn("[Bundle] SHOPIFY_FUNCTION_ID not set — skipping discount creation");
  }

  return redirect("/app/bundles");
};

export default function NewBundle() {
  const shopify = useAppBridge();
  const submit = useSubmit();
  const actionData = useActionData();

  const [title, setTitle] = useState("");
  const [targetType, setTargetType] = useState("all");
  const [layout, setLayout] = useState("classic");
  const [tiers, setTiers] = useState([
    { quantity: 1, discountType: "percentage", discountValue: 0, label: "" },
    { quantity: 2, discountType: "percentage", discountValue: 10, label: "Save 10%" },
    { quantity: 3, discountType: "percentage", discountValue: 20, label: "Most Popular" },
  ]);

  const addTier = () => setTiers([...tiers, { quantity: tiers.length + 1, discountType: "percentage", discountValue: 0, label: "" }]);
  const removeTier = (i) => setTiers(tiers.filter((_, idx) => idx !== i));
  const updateTier = (i, field, value) => {
    const updated = [...tiers];
    updated[i][field] = value;
    setTiers(updated);
  };

  const handleSave = () => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("targetType", targetType);
    formData.append("layout", layout);
    formData.append("tiers", JSON.stringify(tiers));
    submit(formData, { method: "post" });
  };

  return (
    <s-page>
      <TitleBar title="Create Bundle">
        <button onClick={() => shopify.navigate("/app/bundles")}>Cancel</button>
        <button variant="primary" onClick={handleSave}>Save bundle</button>
      </TitleBar>

      {actionData?.error && (
        <div style={{ background: "#fff0f0", padding: "12px", borderRadius: "8px", marginBottom: "16px", color: "#d00" }}>
          {actionData.error}
        </div>
      )}

      <s-section heading="Bundle Settings">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Bundle title</label>
            <input
              style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. T-shirt bundle"
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Apply to</label>
            <select
              style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
              value={targetType}
              onChange={e => setTargetType(e.target.value)}
            >
              <option value="all">All products</option>
              <option value="product">Specific product</option>
              <option value="collection">Specific collection</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Widget layout</label>
            <select
              style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
              value={layout}
              onChange={e => setLayout(e.target.value)}
            >
              <option value="classic">Classic</option>
              <option value="compact">Compact</option>
            </select>
          </div>
        </div>
      </s-section>

      <s-section heading="Quantity Tiers">
        {tiers.map((tier, i) => (
          <div key={i} style={{ border: "1px solid #e0e0e0", borderRadius: "8px", padding: "16px", marginBottom: "12px" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>Qty</label>
                <input
                  type="number"
                  style={{ width: "70px", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                  value={tier.quantity}
                  onChange={e => updateTier(i, "quantity", e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>Discount type</label>
                <select
                  style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                  value={tier.discountType}
                  onChange={e => updateTier(i, "discountType", e.target.value)}
                >
                  <option value="percentage">Percentage off</option>
                  <option value="fixed_amount">Fixed amount off</option>
                  <option value="fixed_price">Fixed price each</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>Value</label>
                <input
                  type="number"
                  style={{ width: "80px", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                  value={tier.discountValue}
                  onChange={e => updateTier(i, "discountValue", e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>Label (optional)</label>
                <input
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                  value={tier.label}
                  onChange={e => updateTier(i, "label", e.target.value)}
                  placeholder="e.g. Most Popular"
                />
              </div>
              <button onClick={() => removeTier(i)} style={{ color: "#d00", background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </div>
          </div>
        ))}
        <button onClick={addTier} style={{ padding: "8px 16px", border: "1px dashed #ccc", borderRadius: "4px", background: "none", cursor: "pointer" }}>
          + Add tier
        </button>
      </s-section>
    </s-page>
  );
}
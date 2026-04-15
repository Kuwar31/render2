import { useLoaderData } from "react-router";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server.js";

const PRODUCTS_QUERY = `#graphql
  query {
    products(first: 10) {
      nodes {
        id
        title
        status
        priceRangeV2 {
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(PRODUCTS_QUERY);
  const { data } = await response.json();

  return { products: data.products.nodes };
};

export default function ProductsPage() {
  const { products } = useLoaderData();

  return (
    <s-page>
      <TitleBar title="Products" />
      <s-section heading="Your Products">
        {products.map((p) => (
          <s-box key={p.id} padding="200">
            <s-paragraph>
              <strong>{p.title}</strong> — {p.status} —{" "}
              {p.priceRangeV2.minVariantPrice.amount}{" "}
              {p.priceRangeV2.minVariantPrice.currencyCode}
            </s-paragraph>
          </s-box>
        ))}
      </s-section>
    </s-page>
  );
}
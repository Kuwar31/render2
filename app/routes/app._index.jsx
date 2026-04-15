import { useLoaderData } from "react-router";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server.js";

const SHOP_QUERY = `#graphql
  query {
    shop {
      name
      email
      primaryDomain {
        url
      }
      plan {
        displayName
      }
    }
  }
`;

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(SHOP_QUERY);
  const { data } = await response.json();

  return { shop: data.shop };
};

export default function Index() {
  const { shop } = useLoaderData();

  return (
    <s-page>
      <TitleBar title="Dashboard" />
      <s-section heading="Shop Info">
        <s-paragraph>Name: {shop.name}</s-paragraph>
        <s-paragraph>Email: {shop.email}</s-paragraph>
        <s-paragraph>Domain: {shop.primaryDomain.url}</s-paragraph>
        <s-paragraph>Plan: {shop.plan.displayName}</s-paragraph>
      </s-section>
    </s-page>
  );
}
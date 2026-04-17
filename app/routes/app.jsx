import { Link, Outlet, useLoaderData, useRouteError, useLocation, useNavigationType } from "react-router";

export default function App() {
  const { apiKey } = useLoaderData();
  const location = useLocation();
  const navType = useNavigationType();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">Dashboard</Link>
        <Link to="/app/bundles">Bundles</Link>
      </NavMenu>
      <Outlet key={`${location.pathname}-${navType}`} />
    </AppProvider>
  );
}
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/company/")({
  component: () => <Navigate to="/company/intelligence" replace />,
});

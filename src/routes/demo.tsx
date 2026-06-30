import { createFileRoute } from "@tanstack/react-router";
import DemoOne from "@/components/ui/demo";

export const Route = createFileRoute("/demo")({
  component: DemoOne,
});

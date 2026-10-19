import type { Metadata } from "next";
import { DemoBoard } from "~/components/demo/demo-board";

export const metadata: Metadata = {
  title: "Demo Board | ATC Flight Strip Manager",
  description: "Try the flight strip board with example flights.",
};

export default function DemoPage() {
  return <DemoBoard />;
}

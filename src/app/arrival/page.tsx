import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ATCFlightStrip } from "~/app/main-board";

export default function DeparturePage() {
  return (
    <>
      <ATCFlightStrip boardType="arrival" />
    </>
  );
}
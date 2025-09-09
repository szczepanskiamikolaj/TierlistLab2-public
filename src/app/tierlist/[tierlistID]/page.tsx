"use client";

import TierlistViewer from "@/components/TierlistViewer";

export default function Page({ params }: { params: { tierlistID: string } }) {
  const { tierlistID } = params;

  return <TierlistViewer tierlistID={tierlistID} />;
}

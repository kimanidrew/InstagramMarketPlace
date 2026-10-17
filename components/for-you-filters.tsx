"use client";

import { useState } from "react";
import { ProductMasonry } from "@/components/product-masonry";
import { CategoryFilterSection } from "@/components/category-filter-section";

export function ForYouFilters({ tags = [] }: { tags?: string[] }) {
  const [selectedTag, setSelectedTag] = useState("");




  return (
    <div>
      <CategoryFilterSection
        variant="for-you"
        eyebrow="Picked for your next find"
        title="Your For You feed"
        ariaLabel="Filter For You products by category"
        selectedValue={selectedTag}
        onSelect={setSelectedTag}
        items={[{ label: "All", value: "" }, ...tags.map((name) => ({ label: name, value: name.toLowerCase() }))]}
        actionLabel="Endless discovery"
      />
      <ProductMasonry personalized tag={selectedTag} />
    </div>
  );
}

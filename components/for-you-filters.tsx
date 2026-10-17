"use client";

import { useState } from "react";
import { ProductMasonry } from "@/components/product-masonry";
import { CategoryFilterSection } from "@/components/category-filter-section";

export function ForYouFilters({ tags = [] }: { tags?: string[] }) {
  const [selectedTag, setSelectedTag] = useState("");




  return (
    <div>
      <CategoryFilterSection
        eyebrow="YOUR DISCOVERY FEED"
        title="Find your kind of thing"
        ariaLabel="Filter For You products by category"
        selectedValue={selectedTag}
        onSelect={setSelectedTag}
        items={[{ label: "All", value: "" }, ...tags.map((name) => ({ label: name, value: name.toLowerCase() }))]}
        actionHref="/categories"
        actionLabel="All categories"
      />
      <ProductMasonry personalized tag={selectedTag} />
    </div>
  );
}

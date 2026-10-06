import "server-only";

type ClassifiedTag = { name: string; type: "PRODUCT" | "CATEGORY" };

export type ProductClassification = {
  category: string;
  subcategory: string;
  tags: ClassifiedTag[];
};

const EXCLUDED_TAGS = new Set([
  "instamart","instagrammarket","instagrammarketplace","nairobi","kenya","kenyan",
  "sale","salealert","shopnow","buy now","dm","order","delivery","follow","followme",
  "explore","explorepage","viral","trending","reels","reelitfeelit",
]);

type Taxonomy = { category: string; subcategory: string; terms: string[] };

const TAXONOMY: Taxonomy[] = [
  { category: "Fashion", subcategory: "Dresses", terms: ["dress","dresses","gown","maxi","midi","mini dress"] },
  { category: "Fashion", subcategory: "Tops", terms: ["top","tops","shirt","shirts","blouse","blouses","tshirt","t-shirt","hoodie","sweater"] },
  { category: "Fashion", subcategory: "Trousers", terms: ["trouser","trousers","pants","jeans","joggers","shorts","leggings"] },
  { category: "Fashion", subcategory: "Shoes", terms: ["shoe","shoes","sneaker","sneakers","heels","sandals","boots","slides","loafer"] },
  { category: "Fashion", subcategory: "Handbags", terms: ["bag","bags","handbag","handbags","purse","purses","tote","clutch","backpack"] },
  { category: "Fashion", subcategory: "Jewelry", terms: ["jewelry","jewellery","necklace","bracelet","earrings","ring","rings","chain","watch","watches"] },
  { category: "Fashion", subcategory: "Accessories", terms: ["accessory","accessories","belt","scarf","hat","cap","sunglasses","wallet"] },
  { category: "Beauty", subcategory: "Skincare", terms: ["skincare","skin care","serum","moisturizer","moisturiser","cleanser","sunscreen","lotion","toner","face wash"] },
  { category: "Beauty", subcategory: "Makeup", terms: ["makeup","cosmetics","lipstick","foundation","concealer","mascara","eyeliner","blush","powder"] },
  { category: "Beauty", subcategory: "Hair", terms: ["hair","wig","wigs","braids","extensions","weave","shampoo","conditioner","locs"] },
  { category: "Beauty", subcategory: "Fragrance", terms: ["perfume","parfum","fragrance","cologne","body mist"] },
  { category: "Home", subcategory: "Furniture", terms: ["furniture","sofa","couch","chair","table","desk","bed","wardrobe","cabinet"] },
  { category: "Home", subcategory: "Decor", terms: ["decor","decoration","vase","mirror","art","frame","candle","rug","carpet","curtain"] },
  { category: "Home", subcategory: "Lighting", terms: ["lamp","lamps","lighting","chandelier","bulb","light"] },
  { category: "Home", subcategory: "Kitchen", terms: ["kitchen","cookware","pan","pot","plate","cup","mug","utensil","blender"] },
  { category: "Electronics", subcategory: "Phones", terms: ["phone","phones","iphone","android","smartphone","mobile"] },
  { category: "Electronics", subcategory: "Computers", terms: ["laptop","laptops","computer","computers","desktop","macbook","tablet","ipad"] },
  { category: "Electronics", subcategory: "Audio", terms: ["headphones","earphones","earbuds","speaker","speakers","audio","microphone"] },
  { category: "Electronics", subcategory: "Cameras", terms: ["camera","cameras","lens","lenses","photography"] },
  { category: "Electronics", subcategory: "Gaming", terms: ["gaming","playstation","xbox","nintendo","controller","console"] },
  { category: "Food & Beverage", subcategory: "Food", terms: ["food","meal","meals","rice","chicken","beef","pizza","burger","snack","pastry"] },
  { category: "Food & Beverage", subcategory: "Bakery", terms: ["cake","cakes","bread","bakery","cupcake","cookies","donut","doughnut"] },
  { category: "Food & Beverage", subcategory: "Drinks", terms: ["coffee","tea","juice","smoothie","drink","drinks","water","soda"] },
  { category: "Health & Wellness", subcategory: "Fitness", terms: ["fitness","gym","workout","training","yoga","exercise","sports"] },
  { category: "Health & Wellness", subcategory: "Wellness", terms: ["wellness","vitamins","supplements","protein","health","organic"] },
  { category: "Kids & Baby", subcategory: "Baby", terms: ["baby","babies","infant","newborn","diapers","stroller"] },
  { category: "Kids & Baby", subcategory: "Toys", terms: ["toy","toys","puzzle","doll","dolls","lego","games"] },
  { category: "Automotive", subcategory: "Vehicles", terms: ["car","cars","vehicle","motorcycle","motorbike","bike","suv"] },
  { category: "Automotive", subcategory: "Parts & Accessories", terms: ["tyre","tires","spare","battery","brake","engine","car accessories"] },
  { category: "Services", subcategory: "Beauty Services", terms: ["salon","barber","barbershop","nails","manicure","pedicure","makeup artist"] },
  { category: "Services", subcategory: "Events", terms: ["events","event","wedding","birthday","decorator","catering"] },
  { category: "Services", subcategory: "Professional", terms: ["photographer","photography","design","designer","consulting","cleaning","repair"] },
];

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/^#+/, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function containsTerm(text: string, term: string) {
  return normalize(text).includes(normalize(term));
}

function scoreTaxonomy(text: string, item: Taxonomy) {
  return item.terms.reduce((score, term) => score + (containsTerm(text, term) ? (term.replace(/\s/g, "").length >= 6 ? 3 : 2) : 0), 0);
}

function classifyTaxonomy(text: string): Taxonomy | null {
  return TAXONOMY
    .map((item) => ({ item, score: scoreTaxonomy(text, item) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.item || null;
}

export function classifyProductTags(hashtags: string[], productTitle: string, caption: string): ProductClassification {
  const candidates = [...new Set(hashtags.map(normalize))].filter(Boolean).filter((tag) => !EXCLUDED_TAGS.has(tag));
  const classification = classifyTaxonomy([productTitle, caption, ...candidates].join(" "));
  const tags: ClassifiedTag[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const tagClassification = classifyTaxonomy(candidate);
    const relevant =
      containsTerm(productTitle, candidate) ||
      containsTerm(caption, candidate) ||
      Boolean(classification && tagClassification && tagClassification.category === classification.category);

    if (relevant && !seen.has(candidate)) {
      seen.add(candidate);
      tags.push({
        name: candidate,
        type: tagClassification?.subcategory === classification?.subcategory ? "CATEGORY" : "PRODUCT",
      });
    }
  }

  if (classification) {
    const categoryTag = normalize(classification.category);
    const subcategoryTag = normalize(classification.subcategory);
    if (!seen.has(categoryTag)) tags.unshift({ name: categoryTag, type: "CATEGORY" });
    if (!seen.has(subcategoryTag)) tags.splice(1, 0, { name: subcategoryTag, type: "CATEGORY" });
  }

  return {
    category: classification?.category || "Other",
    subcategory: classification?.subcategory || "Other",
    tags: tags.slice(0, 10),
  };
}

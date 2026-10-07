import "server-only";

type ClassifiedTag = { name: string; type: "PRODUCT" | "CATEGORY" };

export type ProductClassification = {
  listingType: "PRODUCT" | "SERVICE";
  category: string;
  subcategory: string;
  tags: ClassifiedTag[];
};

const EXCLUDED_TAGS = new Set([
  "instamart", "instagrammarket", "instagrammarketplace", "nairobi", "kenya", "kenyan",
  "sale", "salealert", "shopnow", "dm", "order", "delivery", "follow", "followme",
  "explore", "explorepage", "viral", "trending", "reels", "reelitfeelit", "fyp",
  "discount", "offer", "offers", "promo", "promotion", "newarrival", "newarrivals",
]);

type Taxonomy = { category: string; subcategory: string; terms: string[]; listingType?: "PRODUCT" | "SERVICE" };

const TAXONOMY: Taxonomy[] = [
  { category: "Fashion", subcategory: "Dresses", terms: ["dress","dresses","gown","maxi dress","midi dress","mini dress","bodycon","cocktail dress","evening dress","party dress","summer dress","shirt dress","wrap dress","jumpsuit","romper"] },
  { category: "Fashion", subcategory: "Tops", terms: ["top","tops","shirt","shirts","tshirt","t shirt","tee","blouse","blouses","crop top","tank top","polo","bodysuit","hoodie","sweater","cardigan","jersey"] },
  { category: "Fashion", subcategory: "Trousers", terms: ["trouser","trousers","pants","jeans","joggers","shorts","leggings","chinos","cargo pants","palazzo","culottes","track pants"] },
  { category: "Fashion", subcategory: "Skirts", terms: ["skirt","skirts","mini skirt","midi skirt","maxi skirt","pleated skirt","pencil skirt"] },
  { category: "Fashion", subcategory: "Outerwear", terms: ["jacket","jackets","coat","coats","blazer","blazers","trench coat","denim jacket","leather jacket","vest"] },
  { category: "Fashion", subcategory: "Traditional Wear", terms: ["kitenge","ankara","african print","dashiki","kaftan","kimono","kanzu","leso","traditional wear","african wear"] },
  { category: "Fashion", subcategory: "Activewear", terms: ["activewear","sportswear","gym wear","gymwear","sports bra","running wear","training wear","tracksuit"] },
  { category: "Fashion", subcategory: "Shoes", terms: ["shoe","shoes","sneaker","sneakers","heels","high heels","sandals","boots","slides","loafer","loafers","flats","wedges","espadrilles","cleats"] },
  { category: "Fashion", subcategory: "Handbags", terms: ["bag","bags","handbag","handbags","purse","purses","tote","clutch","backpack","crossbody","shoulder bag","duffel"] },
  { category: "Fashion", subcategory: "Jewelry", terms: ["jewelry","jewellery","necklace","necklaces","bracelet","bracelets","earrings","earring","ring","rings","chain","chains","anklet","brooch"] },
  { category: "Fashion", subcategory: "Watches", terms: ["watch","watches","smartwatch","wristwatch","timepiece"] },
  { category: "Fashion", subcategory: "Accessories", terms: ["accessory","accessories","belt","scarf","hat","cap","sunglasses","wallet","tie","bow tie","gloves","hair accessory"] },
  { category: "Fashion", subcategory: "Underwear & Sleepwear", terms: ["underwear","lingerie","bra","bras","panties","boxers","briefs","sleepwear","pyjamas","pajamas","nightwear"] },
  { category: "Fashion", subcategory: "Swimwear", terms: ["swimwear","swimsuit","bikini","bikinis","swimming costume","beachwear"] },
  { category: "Beauty", subcategory: "Skincare", terms: ["skincare","skin care","serum","moisturizer","moisturiser","cleanser","sunscreen","spf","lotion","toner","face wash","face mask","exfoliator","scrub","eye cream","retinol","vitamin c serum"] },
  { category: "Beauty", subcategory: "Makeup", terms: ["makeup","cosmetics","lipstick","lip gloss","lipgloss","foundation","concealer","mascara","eyeliner","eyeshadow","blush","bronzer","highlighter","powder","setting spray","make up"] },
  { category: "Beauty", subcategory: "Hair", terms: ["hair","wig","wigs","braids","extensions","weave","shampoo","conditioner","hair oil","hair cream","locs","dreadlocks","closure","frontal","human hair","synthetic hair"] },
  { category: "Beauty", subcategory: "Nails", terms: ["nails","nail polish","gel polish","acrylic nails","press on nails","press-on nails","manicure","pedicure"] },
  { category: "Beauty", subcategory: "Fragrance", terms: ["perfume","parfum","fragrance","cologne","body mist","eau de parfum","eau de toilette","attar"] },
  { category: "Beauty", subcategory: "Bath & Body", terms: ["body wash","shower gel","body butter","body scrub","soap","bath salts","deodorant","antiperspirant","body oil"] },
  { category: "Home", subcategory: "Furniture", terms: ["furniture","sofa","couch","sectional","chair","chairs","table","tables","dining table","coffee table","desk","bed","beds","wardrobe","cabinet","drawer","bookshelf","shelf","ottoman"] },
  { category: "Home", subcategory: "Bedroom", terms: ["bedroom","bed frame","mattress","duvet","bedsheet","bed sheets","pillow","pillows","blanket","comforter","headboard"] },
  { category: "Home", subcategory: "Decor", terms: ["decor","decoration","vase","vases","mirror","mirrors","wall art","art","frame","frames","candle","candles","rug","rugs","carpet","curtain","curtains","cushion","throw pillow","ornament","planter"] },
  { category: "Home", subcategory: "Lighting", terms: ["lamp","lamps","lighting","chandelier","bulb","bulbs","light","lights","pendant light","floor lamp","table lamp","led light","solar light"] },
  { category: "Home", subcategory: "Kitchen", terms: ["kitchen","cookware","pan","pans","pot","pots","plate","plates","cup","cups","mug","mugs","utensil","utensils","knife","cutlery","kettle","blender","air fryer","oven","cooktop"] },
  { category: "Home", subcategory: "Appliances", terms: ["appliance","appliances","fridge","refrigerator","freezer","washing machine","dishwasher","microwave","iron","vacuum cleaner","fan","air conditioner","heater"] },
  { category: "Home", subcategory: "Bathroom", terms: ["bathroom","shower","bathtub","toilet","towel","bath towel","bath mat","soap dispenser"] },
  { category: "Electronics", subcategory: "Phones", terms: ["phone","phones","iphone","android","smartphone","mobile","samsung galaxy","pixel","tecno","infinix","oppo","xiaomi"] },
  { category: "Electronics", subcategory: "Computers", terms: ["laptop","laptops","computer","computers","desktop","macbook","chromebook","tablet","ipad","monitor","keyboard","mouse","printer"] },
  { category: "Electronics", subcategory: "Audio", terms: ["headphones","earphones","earbuds","airpods","speaker","speakers","soundbar","audio","microphone","subwoofer","amplifier","home theatre"] },
  { category: "Electronics", subcategory: "Cameras", terms: ["camera","cameras","dslr","mirrorless","lens","lenses","photography","camcorder","action camera","tripod","gimbal"] },
  { category: "Electronics", subcategory: "TV & Entertainment", terms: ["tv","television","smart tv","projector","streaming device","decoder","set top box"] },
  { category: "Electronics", subcategory: "Gaming", terms: ["gaming","playstation","ps5","ps4","xbox","nintendo","switch","controller","console","gaming chair","gaming headset"] },
  { category: "Electronics", subcategory: "Accessories", terms: ["charger","charging cable","power bank","usb cable","adapter","phone case","screen protector","memory card","flash drive","hard drive","ssd"] },
  { category: "Food & Beverage", subcategory: "Food", terms: ["food","meal","meals","rice","chicken","beef","goat","fish","pork","pasta","pizza","burger","sandwich","fries","snack","salad","soup","stew","chapati","samosa","nyama choma"] },
  { category: "Food & Beverage", subcategory: "Bakery", terms: ["cake","cakes","bread","bakery","cupcake","cupcakes","cookies","cookie","donut","doughnut","muffin","brownie","pastry","croissant","mandazi","biscuit"] },
  { category: "Food & Beverage", subcategory: "Drinks", terms: ["coffee","tea","juice","smoothie","drink","drinks","water","soda","soft drink","milkshake","mocktail","lemonade","energy drink"] },
  { category: "Food & Beverage", subcategory: "Grocery", terms: ["grocery","groceries","flour","sugar","cooking oil","spices","cereal","beans","lentils","honey","jam","peanut butter"] },
  { category: "Health & Wellness", subcategory: "Fitness", terms: ["fitness","gym","workout","training","yoga","exercise","sports","dumbbell","weights","resistance band","treadmill","fitness mat","protein"] },
  { category: "Health & Wellness", subcategory: "Wellness", terms: ["wellness","health","vitamins","supplements","organic","herbal","essential oil","aromatherapy","meditation","sleep"] },
  { category: "Kids & Baby", subcategory: "Baby", terms: ["baby","babies","infant","newborn","diapers","nappies","stroller","pram","baby carrier","baby clothes","feeding bottle","pacifier","cot"] },
  { category: "Kids & Baby", subcategory: "Toys", terms: ["toy","toys","puzzle","doll","dolls","lego","games","teddy bear","stuffed animal","remote control car","building blocks"] },
  { category: "Kids & Baby", subcategory: "Kids Fashion", terms: ["kids clothes","children clothes","boys clothes","girls clothes","school uniform","kids shoes","school shoes"] },
  { category: "Automotive", subcategory: "Vehicles", terms: ["car","cars","vehicle","vehicles","motorcycle","motorbike","scooter","suv","van","truck","pickup","bus"] },
  { category: "Automotive", subcategory: "Parts & Accessories", terms: ["tyre","tires","tire","spare","battery","brake","engine","oil filter","air filter","car accessories","seat cover","floor mat","car stereo","roof rack"] },
  { category: "Sports & Outdoors", subcategory: "Sports Equipment", terms: ["football","soccer","basketball","volleyball","tennis","racket","badminton","boxing","gloves","sports equipment","ball","jersey"] },
  { category: "Sports & Outdoors", subcategory: "Outdoor", terms: ["camping","tent","hiking","backpacking","fishing","fishing rod","outdoor","travel bag","sleeping bag","binoculars"] },
  { category: "Pets", subcategory: "Pet Supplies", terms: ["pet","pets","dog","cat","puppy","kitten","pet food","dog food","cat food","leash","collar","pet bed","pet toy","aquarium"] },
  { category: "Office & Stationery", subcategory: "Stationery", terms: ["stationery","notebook","notebooks","journal","planner","pen","pens","pencil","pencils","marker","markers","diary","sticker","stickers"] },
  { category: "Office & Stationery", subcategory: "Office Equipment", terms: ["office","office chair","filing cabinet","printer","scanner","projector","desk organizer","whiteboard"] },
  { category: "Books & Media", subcategory: "Books", terms: ["book","books","novel","textbook","textbooks","magazine","magazines","comic","comics","children book","cookbook"] },
  { listingType: "SERVICE", category: "Services", subcategory: "Beauty Services", terms: ["salon","barber","barbershop","nails","manicure","pedicure","makeup artist","hair stylist","braiding","massage","spa"] },
  { category: "Services", subcategory: "Events", terms: ["events","event","wedding","birthday","party","event planner","decorator","catering","photobooth","venue"] },
  { category: "Services", subcategory: "Professional", terms: ["photographer","photography","videographer","video production","design","designer","graphic design","consulting","accounting","legal","cleaning","repair","printing","marketing"] },
  { category: "Services", subcategory: "Transport & Delivery", terms: ["transport","taxi","cab","ride","delivery service","courier","moving service","logistics"] },
  { listingType: "SERVICE", category: "Real Estate", subcategory: "Property", terms: ["house","home","apartment","apartments","flat","flats","land","property","plot","office space","commercial property","villa","townhouse"] },
  { listingType: "SERVICE", category: "Travel & Experiences", subcategory: "Travel", terms: ["travel","tour","tours","safari","hotel","resort","holiday","vacation","flight","airbnb","accommodation"] },
  { category: "Art & Crafts", subcategory: "Handmade", terms: ["handmade","handcrafted","craft","crafts","crochet","knitting","beads","beaded","woodwork","pottery","ceramics","artwork","painting"] },
  { category: "Agriculture", subcategory: "Farm Products", terms: ["farm","farming","farmer","vegetables","fruits","fresh produce","eggs","milk","honey","flowers","seedlings","plants"] },
];

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/^#+/, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function containsTerm(text: string, term: string) {
  const normalizedText = normalize(text);
  const normalizedTerm = normalize(term);
  if (!normalizedTerm) return false;
  return normalizedText.split(" ").includes(normalizedTerm) || normalizedText.includes(normalizedTerm);
}

function scoreTaxonomy(text: string, item: Taxonomy) {
  return item.terms.reduce((score, term) => {
    if (!containsTerm(text, term)) return score;
    const normalized = normalize(term);
    return score + (normalized.includes(" ") || normalized.length >= 6 ? 3 : 2);
  }, 0);
}

function classifyTaxonomy(text: string): Taxonomy | null {
  return TAXONOMY
    .map((item) => ({ item, score: scoreTaxonomy(text, item) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.item || null;
}

export function classifyProductTags(hashtags: string[], productTitle: string, caption: string): ProductClassification {
  const candidates = [...new Set(hashtags.map(normalize))]
    .filter(Boolean)
    .filter((tag) => !EXCLUDED_TAGS.has(tag));

  const sourceText = [productTitle, caption, ...candidates].join(" ");
  const classification = classifyTaxonomy(sourceText);
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
    listingType: classification?.listingType || "PRODUCT",
    category: classification?.category || "Other",
    subcategory: classification?.subcategory || "Other",
    tags: tags.slice(0, 10),
  };
}

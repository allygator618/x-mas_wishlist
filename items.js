// ===========================================================
//  YOUR WISHLIST — this is the only file you edit to add items
// ===========================================================

export const siteTitle = "Christmas Wishlist 2026";
export const siteSubtitle = "Tap a card to see the item. Tap the button to mark it as purchased.";

// Each item is one block between { } followed by a comma.
//
//   name  (required) text in quotes
//   link  (required) full product page URL, starting with https://
//   image (required) EITHER a full image URL (https://...)
//                    OR a file in your repo's images folder, e.g. "images/boots.png"
//   size  (optional) text in quotes, or leave it out / use "" if not applicable
//
// Keep each item's name (plus size) unique: that is how the site remembers
// which items are purchased. Renaming an item resets its purchased status.

export const items = [
  {
    name: "Example Winter Boots",
    size: "Women's 8",
    image: "images/boots.png",
    link: "https://www.example.com/winter-boots",
  },
  {
    name: "Example Coffee Mug",
    size: "",
    image: "https://placehold.co/600x600/png?text=Mug",
    link: "https://www.example.com/coffee-mug",
  },
];

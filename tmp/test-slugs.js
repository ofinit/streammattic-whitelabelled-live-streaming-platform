function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, "-and-")   // Replace & with 'and'
    .replace(/\//g, "-")      // Replace / with -
    .replace(/[-\s]+/g, "-")  // Replace spaces and dashes with a single dash
    .replace(/[^\w-]+/g, "")  // Remove all remaining non-word chars except dashes
    .replace(/--+/g, "-")     // Final pass to collapse multiple dashes
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes
}

const tests = [
  "Friday Night Live - Indie Session",
  "Event & Crew / Live",
  "   Multiple   Spaces   ",
  "---Leading and Trailing---",
  "Special @#$%^&* Chars",
  "Already-Dashed-Event"
];

tests.forEach(t => {
  console.log(`Input: "${t}" => Output: "${slugify(t)}"`);
});

/* =========================
   🪄 HOVER TO LOOKUP (NEW)
   ========================= */

// enable/disable hover feature
const HOVER_LOOKUP_ENABLED = true;

// tweak these to your liking
const HOVER_DELAY_MS = 350;     // how long to hover before lookup
const HOVER_MIN_LEN = 2;        // ignore 1-letter words
const HOVER_MAX_LEN = 40;       // ignore extremely long tokens

let hoverTimer = null;
let lastHoverWord = "";
let lastHoverAt = 0;

/**
 * Extract a "word" from the mouse position.
 * Uses caretPositionFromPoint/caretRangeFromPoint to find text nodes.
 */
function getWordFromPoint(x, y) {
    let range = null;

    if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(x, y);
        if (!pos || !pos.offsetNode) return "";
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.setEnd(pos.offsetNode, pos.offset);
    } else if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(x, y);
        if (!range) return "";
    } else {
        return "";
    }

    const node = range.startContainer;
    if (!node || node.nodeType !== Node.TEXT_NODE) return "";

    const text = node.textContent || "";
    let i = range.startOffset;

    // If offset is at end, move left one char
    if (i > 0 && i === text.length) i--;

    // Expand left/right to word boundaries
    const isWordChar = ch => /[A-Za-zÄÖÜäöüß-]/.test(ch);

    let start = i;
    while (start > 0 && isWordChar(text[start - 1])) start--;

    let end = i;
    while (end < text.length && isWordChar(text[end])) end++;

    const raw = text.slice(start, end);
    return clean(raw);
}

/**
 * Whether a word is valid for lookup (same rules as selection trigger).
 */
function isValidLookupWord(w) {
    if (!w) return false;
    if (w.length < HOVER_MIN_LEN || w.length > HOVER_MAX_LEN) return false;
    if (/\s/.test(w)) return false;
    if (!/^[A-Za-zÄÖÜäöüß]+(-[A-Za-zÄÖÜäöüß]+)*$/.test(w)) return false;
    return true;
}

if (HOVER_LOOKUP_ENABLED) {
    document.addEventListener("mousemove", (e) => {
        // Don't trigger if the popup itself is being hovered/clicked
        const box = document.getElementById("dictBox");
        if (box && box.contains(e.target)) return;

        // Don't trigger over form fields / editable content
        const t = e.target;
        if (t && (t.closest("input, textarea, [contenteditable='true']"))) return;

        const w = getWordFromPoint(e.clientX, e.clientY);
        if (!isValidLookupWord(w)) {
            if (hoverTimer) clearTimeout(hoverTimer);
            hoverTimer = null;
            return;
        }

        // avoid repeated lookups of the same word too frequently
        const now = Date.now();
        if (w === lastHoverWord && (now - lastHoverAt) < 1200) return;

        if (hoverTimer) clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
            lastHoverWord = w;
            lastHoverAt = Date.now();
            resolveDual(w); // ✅ reuse your existing logic unchanged
        }, HOVER_DELAY_MS);
    });

    // optional: hide popup when mouse leaves the page window
    window.addEventListener("blur", () => {
        const box = document.getElementById("dictBox");
        if (box) box.remove();
    });
}

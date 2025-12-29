const BOOKMARK_KEY = 'a01-terminal-bookmark';

export function saveBookmark() {
  const scrollPosition = window.scrollY;
  localStorage.setItem(BOOKMARK_KEY, scrollPosition);
  console.log(`[Bookmarks] Bookmark saved at position ${scrollPosition}`);
}

export function loadBookmark() {
  const savedPosition = localStorage.getItem(BOOKMARK_KEY);
  if (savedPosition) {
    window.scrollTo(0, parseInt(savedPosition, 10));
    console.log(`[Bookmarks] Bookmark loaded to position ${savedPosition}`);
  }
}

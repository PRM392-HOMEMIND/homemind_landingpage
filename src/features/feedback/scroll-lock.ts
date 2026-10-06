type Lock = { users: number; restore: () => void };
const locks = new WeakMap<Document, Lock>();

/** Reference counting applies to this popup's instances, not unrelated modal code. */
export function lockPageScroll(doc: Document): () => void {
  let lock = locks.get(doc);
  if (!lock) {
    const root = doc.documentElement;
    const body = doc.body;
    const win = doc.defaultView!;
    const { scrollX, scrollY } = win;
    const overflow = root.style.overflow;
    const saved = {
      overflow: body.style.overflow, position: body.style.position,
      top: body.style.top, left: body.style.left, width: body.style.width,
      paddingRight: body.style.paddingRight,
    };
    const gutter = win.innerWidth - root.clientWidth;
    const padding = win.getComputedStyle(body).paddingRight;
    root.style.overflow = "hidden";
    Object.assign(body.style, {
      overflow: "hidden", position: "fixed", top: `${-scrollY}px`,
      left: `${-scrollX}px`, width: "100%",
      paddingRight: `calc(${padding} + ${gutter}px)`,
    });
    lock = { users: 0, restore: () => {
      root.style.overflow = overflow;
      Object.assign(body.style, saved);
      win.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
    } };
    locks.set(doc, lock);
  }
  lock.users++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--lock.users === 0) {
      lock.restore();
      locks.delete(doc);
    }
  };
}

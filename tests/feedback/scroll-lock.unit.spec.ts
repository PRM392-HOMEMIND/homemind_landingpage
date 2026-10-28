import { expect, test } from "@playwright/test";
import { lockPageScroll } from "../../src/features/feedback/scroll-lock";

test("scroll lock restores exact prior styles/position, nested ownership and idempotent release", () => {
  const root = { clientWidth: 980, style: { overflow: "clip" } };
  const initial = { overflow: "auto", position: "relative", top: "2px", left: "3px", width: "90%", paddingRight: "8px" };
  const body = { style: { ...initial } };
  const positions: unknown[] = [];
  const doc = { documentElement: root, body, defaultView: {
    scrollX: 4, scrollY: 321, innerWidth: 1000,
    getComputedStyle: () => ({ paddingRight: "8px" }), scrollTo: (value: unknown) => positions.push(value),
  } } as unknown as Document;
  const release = lockPageScroll(doc);
  expect(body.style.position).toBe("fixed");
  expect(body.style.top).toBe("-321px");
  expect(body.style.paddingRight).toBe("calc(8px + 20px)");
  const nested = lockPageScroll(doc);
  release();
  release();
  expect(root.style.overflow).toBe("hidden");
  nested();
  expect(body.style).toEqual(initial);
  expect(root.style.overflow).toBe("clip");
  expect(positions).toEqual([{ left: 4, top: 321, behavior: "instant" }]);
  lockPageScroll(doc)();
  expect(positions).toHaveLength(2);
});

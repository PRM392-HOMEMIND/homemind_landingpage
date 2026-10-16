"use client";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
export type MenuAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
};
export function ActionMenu({
  label,
  actions,
}: {
  label: string;
  actions: MenuAction[];
}) {
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  function close() {
    setPosition(null);
    trigger.current?.focus({ preventScroll: true });
  }
  function open() {
    const box = trigger.current!.getBoundingClientRect();
    const height = actions.length * 44 + 16;
    setPosition({
      left: Math.max(8, Math.min(window.innerWidth - 256, box.right - 240)),
      top: Math.max(
        8,
        Math.min(
          window.innerHeight - height - 8,
          box.bottom + height > window.innerHeight
            ? box.top - height - 6
            : box.bottom + 6,
        ),
      ),
    });
  }
  useEffect(() => {
    if (!position) return;
    menu.current
      ?.querySelector<HTMLElement>('[role="menuitem"]')
      ?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      if (
        !menu.current?.contains(event.target as Node) &&
        !trigger.current?.contains(event.target as Node)
      )
        close();
    };
    const move = () => close();
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", move);
    window.addEventListener("scroll", move, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", move);
      window.removeEventListener("scroll", move, true);
    };
  }, [position]);
  return (
    <>
      <button
        ref={trigger}
        className="hm-icon-button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={!!position}
        aria-controls={position ? id : undefined}
        onClick={() => (position ? close() : open())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            open();
          }
        }}
      >
        <MoreHorizontal size={20} aria-hidden="true" />
      </button>
      {position &&
        createPortal(
          <div className="hm-admin hm-menu-layer">
            <div
              id={id}
              ref={menu}
              className="hm-menu"
              role="menu"
              aria-label={label}
              style={position}
              onKeyDown={(event) => {
                const nodes = Array.from(
                  menu.current!.querySelectorAll<HTMLElement>(
                    '[role="menuitem"]',
                  ),
                );
                const index = nodes.indexOf(
                  document.activeElement as HTMLElement,
                );
                if (event.key === "Escape") {
                  event.preventDefault();
                  close();
                } else if (event.key === "Tab") {
                  close();
                } else if (
                  ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
                ) {
                  event.preventDefault();
                  nodes[
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? nodes.length - 1
                        : (index +
                            (event.key === "ArrowDown" ? 1 : -1) +
                            nodes.length) %
                          nodes.length
                  ]?.focus();
                }
              }}
            >
              {actions.map((action) =>
                action.href ? (
                  <Link
                    key={action.label}
                    prefetch={false}
                    role="menuitem"
                    href={action.href}
                    onClick={close}
                  >
                    {action.label}
                  </Link>
                ) : (
                  <button
                    key={action.label}
                    role="menuitem"
                    className={action.danger ? "hm-danger-text" : ""}
                    onClick={() => {
                      close();
                      action.onClick?.();
                    }}
                  >
                    {action.label}
                  </button>
                ),
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

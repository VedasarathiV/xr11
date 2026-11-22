import { useMemo, useRef, useState } from "react";
import { Icon, type IconName } from "../design/icons";
import { actions } from "../lib/actions";
import { kbd } from "../lib/keys";
import { api } from "../lib/api";
import { t } from "../lib/i18n";
import { displayName } from "../lib/present";
import { type View, useApp } from "../lib/store";
import { attempt, useUi } from "../lib/ui";

interface Command {
  id: string;
  group: string;
  label: string;
  icon: IconName;
  kbd?: string;
  run: () => void;
}

/**
 * xr11 command palette (Ctrl Shift P): one keyboard surface for downloads,
 * navigation and appearance. Search ranks the prefix/exact matches first.
 */
export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen);
  const close = useUi((s) => s.closePalette);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const categories = useApp((s) => s.categories);
  const queues = useApp((s) => s.queues);
  const projects = useApp((s) => s.grabberProjects);
  const nav = (view: View) => () => useApp.getState().setView(view);

  const commands = useMemo<Command[]>(() => {
    const go = (id: string, label: string, icon: IconName, view: View): Command => ({
      id: `go-${id}`,
      group: t("Go to"),
      label,
      icon,
      run: nav(view),
    });
    return [
      {
        id: "add-url",
        group: t("Downloads"),
        label: t("Add a download URL…"),
        icon: "add-url",
        kbd: "Ctrl N",
        run: actions.openAddUrl,
      },
      {
        id: "batch",
        group: t("Downloads"),
        label: t("Batch download…"),
        icon: "batch",
        run: () => useUi.getState().openDialog({ kind: "batch" }),
      },
      {
        id: "grabber",
        group: t("Downloads"),
        label: t("Site grabber"),
        icon: "grabber",
        run: () => useUi.getState().openSheet({ kind: "grabber" }),
      },
      {
        id: "scheduler",
        group: t("Downloads"),
        label: t("Scheduler"),
        icon: "scheduler",
        run: () => useUi.getState().openSheet({ kind: "scheduler" }),
      },
      {
        id: "insights",
        group: t("Downloads"),
        label: t("Library insights"),
        icon: "activity",
        run: () => useUi.getState().openSheet({ kind: "insights" }),
      },
      {
        id: "resume-all",
        group: t("Actions"),
        label: t("Resume all downloads"),
        icon: "resume",
        run: () => void attempt(api.resumeAll()),
      },
      {
        id: "pause-all",
        group: t("Actions"),
        label: t("Pause all downloads"),
        icon: "pause",
        run: actions.pauseAll,
      },
      {
        id: "limiter",
        group: t("Actions"),
        label: t("Toggle speed limiter"),
        icon: "speed-limiter",
        kbd: "Ctrl L",
        run: () => void actions.toggleLimiter(),
      },
      {
        id: "mini",
        group: t("Actions"),
        label: t("Open the mini window"),
        icon: "mini-mode",
        kbd: "Ctrl Shift M",
        run: actions.toggleMini,
      },
      {
        id: "theme",
        group: t("Appearance"),
        label: t("Switch light / dark theme"),
        icon: "sun",
        run: () => {
          const root = document.documentElement;
          const next = root.dataset.theme === "dark" ? "light" : "dark";
          void import("../lib/actions").then(({ patchSettings }) => patchSettings({ appearance: { theme: next } }));
        },
      },
      {
        id: "settings",
        group: t("Appearance"),
        label: t("Settings"),
        icon: "settings",
        kbd: "Ctrl ,",
        run: () => useUi.getState().openSheet({ kind: "settings" }),
      },
      go("all", t("All downloads"), "all", { kind: "all" }),
      go("unfinished", t("Unfinished"), "unfinished", { kind: "status", id: "unfinished" }),
      go("finished", t("Finished"), "finished", { kind: "status", id: "finished" }),
      go("trash", t("Trash"), "trash", { kind: "trash" }),
      ...categories.map((c) => go(`cat-${c.id}`, displayName(c.name), "folder", { kind: "category", id: c.id })),
      ...queues.map((q) => go(`queue-${q.id}`, displayName(q.name), "queue", { kind: "queue", id: q.id })),
      ...projects.map((p) => go(`project-${p.id}`, p.name, "grabber-project", { kind: "grabber", id: p.id })),
    ];
  }, [categories, queues, projects]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    const score = (c: Command) => {
      const label = c.label.toLowerCase();
      if (label === q) return 0;
      if (label.startsWith(q)) return 1;
      if (label.includes(q)) return 2;
      if (c.group.toLowerCase().includes(q)) return 3;
      return -1;
    };
    return commands
      .map((c) => ({ c, s: score(c) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => a.s - b.s)
      .map((x) => x.c);
  }, [commands, query]);

  if (!open) return null;
  const current = Math.min(index, Math.max(0, items.length - 1));

  const run = (command?: Command) => {
    if (!command) return;
    close();
    setQuery("");
    setIndex(0);
    command.run();
  };

  return (
    <div
      className="palette-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="palette glass-strong blur-sm" role="dialog" aria-modal="true" aria-label={t("Command palette")}>
        <div className="palette__search">
          <Icon name="search" size={18} />
          <input
            ref={(el) => {
              input.current = el;
              if (el && document.activeElement !== el) el.focus();
            }}
            value={query}
            placeholder={t("Type a command, view or setting…")}
            aria-label={t("Command palette")}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                close();
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex(items.length ? (current + 1) % items.length : 0);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex(items.length ? (current - 1 + items.length) % items.length : 0);
              } else if (e.key === "Enter") {
                e.preventDefault();
                run(items[current]);
              }
            }}
          />
          <span className="kbd">Esc</span>
        </div>
        <div className="palette__list" role="listbox" aria-label={t("Commands")}>
          {items.length === 0 && <div className="palette__empty">{t("No commands match “{query}”", { query: query.trim() })}</div>}
          {items.map((c, i) => {
            const first = i === 0 || items[i - 1].group !== c.group;
            return (
              <div key={c.id}>
                {first && <div className="palette__group">{c.group}</div>}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === current}
                  className="palette__item"
                  onMouseMove={() => setIndex(i)}
                  onClick={() => run(c)}
                >
                  <Icon name={c.icon} size={16} />
                  <span className="ellipsis">{c.label}</span>
                  {c.kbd && <span className="kbd">{kbd(c.kbd)}</span>}
                </button>
              </div>
            );
          })}
        </div>
        <div className="palette__foot">
          <span>
            <span className="kbd">↑</span> <span className="kbd">↓</span> {t("to move")}
          </span>
          <span>
            <span className="kbd">Enter</span> {t("to run")}
          </span>
          <span className="spacer" />
          <span>xr11</span>
        </div>
      </div>
    </div>
  );
}

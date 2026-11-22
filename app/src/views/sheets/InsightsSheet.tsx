import { useMemo } from "react";
import { Icon } from "../../design/icons";
import { formatBytes } from "../../lib/format";
import { t } from "../../lib/i18n";
import { displayName } from "../../lib/present";
import { isActive, useApp } from "../../lib/store";

const DAY = 86_400_000;

/**
 * Library insights: a read-only overview of everything xr11 has downloaded,
 * derived from the download list (no extra backend calls).
 */
export function InsightsSheet() {
  const items = useApp((s) => s.items);
  const categories = useApp((s) => s.categories);
  const progress = useApp((s) => s.progress);
  const data = useMemo(() => {
    const all = Object.values(items).filter((i) => !i.trashed);
    const now = Date.now();
    const completed = all.filter((i) => i.status === "completed");
    const active = all.filter((i) => isActive(i.status));
    const failed = all.filter((i) => i.status === "failed");
    const totalBytes = all.reduce((sum, i) => sum + (i.size ?? i.downloaded ?? 0), 0);
    const doneBytes = completed.reduce((sum, i) => sum + (i.size ?? i.downloaded ?? 0), 0);
    const weekAgo = now - 7 * DAY;
    const week = completed.filter((i) => (i.finishedAt ?? i.addedAt) >= weekAgo);
    const liveSpeed = Object.values(progress).reduce((sum, p) => sum + (p.speed || 0), 0);

    const byCategory = new Map<string, { bytes: number; count: number }>();
    for (const i of all) {
      const entry = byCategory.get(i.category) ?? { bytes: 0, count: 0 };
      entry.bytes += i.size ?? i.downloaded ?? 0;
      entry.count++;
      byCategory.set(i.category, entry);
    }
    const categoryRows = [...byCategory.entries()]
      .map(([id, v]) => ({
        id,
        name: displayName(categories.find((c) => c.id === id)?.name ?? id),
        ...v,
      }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 6);
    const maxCategory = Math.max(1, ...categoryRows.map((r) => r.bytes));

    const days = Array.from({ length: 14 }, (_, n) => {
      const start = new Date(now - (13 - n) * DAY);
      start.setHours(0, 0, 0, 0);
      const end = start.getTime() + DAY;
      return all.filter((i) => i.addedAt >= start.getTime() && i.addedAt < end).length;
    });
    const maxDay = Math.max(1, ...days);

    const largest = [...all].sort((a, b) => (b.size ?? 0) - (a.size ?? 0))[0];
    const oldest = [...all].sort((a, b) => a.addedAt - b.addedAt)[0];
    return {
      total: all.length,
      completed: completed.length,
      active: active.length,
      failed: failed.length,
      totalBytes,
      doneBytes,
      weekCount: week.length,
      weekBytes: week.reduce((sum, i) => sum + (i.size ?? i.downloaded ?? 0), 0),
      liveSpeed,
      categoryRows,
      maxCategory,
      days,
      maxDay,
      largest,
      oldest,
      savedRatio: totalBytes ? doneBytes / totalBytes : 0,
    };
  }, [items, categories, progress]);

  return (
    <div className="insights">
      <div className="insights__hero">
        <div className="insights__stat">
          <div className="k">{t("In the library")}</div>
          <div className="v">
            {data.total} <small>{t("downloads")}</small>
          </div>
        </div>
        <div className="insights__stat">
          <div className="k">{t("Completed")}</div>
          <div className="v">
            {formatBytes(data.doneBytes)} <small>{data.completed}</small>
          </div>
        </div>
        <div className="insights__stat">
          <div className="k">{t("Last 7 days")}</div>
          <div className="v">
            {data.weekCount} <small>{formatBytes(data.weekBytes)}</small>
          </div>
        </div>
        <div className="insights__stat">
          <div className="k">{t("Live speed")}</div>
          <div className="v">
            {formatBytes(data.liveSpeed)}<small>/s</small>
          </div>
        </div>
      </div>

      <div className="insights__panel">
        <h3>{t("Storage by category")}</h3>
        {data.categoryRows.length === 0 && <p className="insights__note">{t("Nothing downloaded yet — your first download will show up here.")}</p>}
        {data.categoryRows.map((row) => (
          <div className="insights__bar" key={row.id}>
            <span className="t">{row.name}</span>
            <span className="track">
              <span className="fill" style={{ width: `${Math.max(2, (row.bytes / data.maxCategory) * 100)}%` }} />
            </span>
            <span className="n">
              {formatBytes(row.bytes)} · {row.count}
            </span>
          </div>
        ))}
      </div>

      <div className="insights__panel">
        <h3>{t("New downloads · last 14 days")}</h3>
        <div className="insights__days" aria-label={t("New downloads per day")}>
          {data.days.map((n, i) => (
            <span className="insights__day" key={i} title={String(n)}>
              <i style={{ height: `${Math.max(3, (n / data.maxDay) * 100)}%`, opacity: n ? 1 : 0.25 }} />
            </span>
          ))}
        </div>
        <div className="insights__legend">
          <span>{t("14 days ago")}</span>
          <span>{t("Today")}</span>
        </div>
      </div>

      <div className="insights__hero">
        <div className="insights__stat">
          <div className="k">{t("Downloading now")}</div>
          <div className="v">{data.active}</div>
        </div>
        <div className="insights__stat">
          <div className="k">{t("Failed")}</div>
          <div className="v">{data.failed}</div>
        </div>
        <div className="insights__stat">
          <div className="k">{t("Largest download")}</div>
          <div className="v" style={{ fontSize: 17, fontFamily: "var(--font-sans)", fontWeight: 600 }}>
            <span className="ellipsis" style={{ display: "block" }} title={data.largest?.fileName}>
              {data.largest ? data.largest.fileName : "—"}
            </span>
            <small>{data.largest?.size ? formatBytes(data.largest.size) : ""}</small>
          </div>
        </div>
        <div className="insights__stat">
          <div className="k">{t("Oldest download")}</div>
          <div className="v" style={{ fontSize: 17, fontFamily: "var(--font-sans)", fontWeight: 600 }}>
            <span className="ellipsis" style={{ display: "block" }} title={data.oldest?.fileName}>
              {data.oldest ? data.oldest.fileName : "—"}
            </span>
            <small>{data.oldest ? new Date(data.oldest.addedAt).toLocaleDateString() : ""}</small>
          </div>
        </div>
      </div>

      <p className="insights__note">
        <Icon name="info" size={13} />{" "}
        {t("Insights are calculated locally from your download list. Nothing leaves this computer.")}
      </p>
    </div>
  );
}

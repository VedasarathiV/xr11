import { useEffect } from "react";
import { BrandTile } from "../../components/LogoMark";
import { Icon, type IconName } from "../../design/icons";
import { patchSettings } from "../../lib/actions";
import { t, tk } from "../../lib/i18n";
import { useApp } from "../../lib/store";
import { useUi } from "../../lib/ui";
import { versionNewer } from "../../lib/version";
import { BrowserConnect, useExtensionStatus } from "../BrowserConnect";

type Change = { icon: IconName; title: string; body: string; credit?: string; action?: "sounds" | "language" | "appearance" };

/**
 * What this version brings (shown once after an update, and from About xr11), then what the
 * version before brought, for people updating from older ones. Titles and bodies are translated
 * where they're shown; `credit` is the contributor's handle.
 */
const CHANGES: Change[] = [
  {
    icon: "video",
    title: tk("Just a part of a video"),
    body: tk("Pick a quality with the Download button next to a video, or open the “Download video” window in xr11, and choose “Only a part”: where it starts and ends, or a chapter. xr11 downloads only that part."),
  },
  {
    icon: "file-archive",
    title: tk("What's inside a ZIP"),
    body: tk("The “Download file” window shows the files in a ZIP before you download it, and can download just one of them."),
  },
  {
    icon: "status-completed",
    title: tk("Finished means finished"),
    body: tk("A download that finished while the window was open sometimes still looked like it was downloading."),
    credit: "nckrkllkc",
  },
];

/** The previous version's changes, shown below the new ones. */
const PREVIOUS = { version: "1.1.8", changes: [
  {
    icon: "batch",
    title: tk("Lists of links"),
    body: tk("A pasted list of links opens one Download links window again, not a second one that froze and couldn't be closed."),
  },
  {
    icon: "monitor",
    title: tk("xr11 on Linux"),
    body: tk("On KDE Plasma, a window brought back from the taskbar no longer stays empty, and xr11 gives memory back after long downloads."),
  },
  {
    icon: "eye",
    title: tk("Dock icon on the Mac"),
    body: tk("xr11 can hide its Dock icon while it waits in the menu bar: Settings › General."),
    credit: "mehdiillala",
  },
] satisfies Change[] };

/**
 * "What's new" after an update: the browser extension from the Chrome Web Store first (one
 * click, updates itself; replaces one added by hand), then what else changed.
 */
export function WhatsNewSheet() {
  const version = useApp((s) => s.version);
  const { status, connected } = useExtensionStatus();
  return (
    <div className="whatsnew">
      <header className="whatsnew__head">
        <BrandTile size={52} />
        <div>
          <h2>{t("xr11 {version} is here", { version })}</h2>
        </div>
      </header>

      <section className="whatsnew__store card">
        <div className="whatsnew__storehead">
          <Icon name="puzzle" size={18} className="text-accent" />
          <div>
            <b>{t("Add xr11 to your browser")}</b>
            <div className="t-small text-secondary">
              {t("The extension ships with xr11. Load it once from the folder below; every xr11 update keeps it current.")}
            </div>
          </div>
        </div>
        <BrowserConnect status={status} connected={connected} />
      </section>

      <ChangeList changes={CHANGES} />
      <h3 className="whatsnew__older t-small text-tertiary">{t("New in xr11 {version}", { version: PREVIOUS.version })}</h3>
      <ChangeList changes={PREVIOUS.changes} />
      <p className="whatsnew__star t-small text-secondary">
        <Icon name="shield" size={14} className="text-accent" />
        <span>{t("xr11 is yours: no accounts, no ads and no telemetry. Everything stays on this computer.")}</span>
      </p>
    </div>
  );
}

function ChangeList({ changes }: { changes: Change[] }) {
  const openSheet = useUi((s) => s.openSheet);
  return (
    <ul className="whatsnew__list">
      {changes.map((c) => (
        <li key={c.title}>
          <span className="whatsnew__icon">
            <Icon name={c.icon} size={16} />
          </span>
          <div>
            <b>{t(c.title)}</b>
            <div className="t-small text-secondary">
              {t(c.body)}
              {c.credit && ` ${t("Thanks to {name}!", { name: c.credit })}`}{" "}
              {c.action === "sounds" && (
                <button type="button" className="linkbtn" onClick={() => openSheet({ kind: "settings", section: "sounds" })}>
                  {t("Try them")}
                </button>
              )}
              {c.action === "appearance" && (
                <button type="button" className="linkbtn" onClick={() => openSheet({ kind: "settings", section: "appearance" })}>
                  {t("Try it")}
                </button>
              )}
              {c.action === "language" && (
                <button type="button" className="linkbtn" onClick={() => openSheet({ kind: "settings", section: "general" })}>
                  {t("Choose a language")}
                </button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Opens "What's new" once after xr11 was updated, when the main window is on screen (not while
 * it starts hidden in the tray). A fresh install shows the onboarding instead and only records
 * the version.
 */
export function useWhatsNew() {
  const version = useApp((s) => s.version);
  const seen = useApp((s) => s.settings?.lastSeenVersion);
  const onboarded = useApp((s) => s.settings?.onboardingDone);
  useEffect(() => {
    if (!version || seen === undefined || onboarded === undefined || seen === version) return;
    if (!onboarded || (seen && !versionNewer(version, seen))) {
      void patchSettings({ lastSeenVersion: version });
      return;
    }
    const show = () => {
      if (document.visibilityState !== "visible") return false;
      if (!useUi.getState().sheet) useUi.getState().openSheet({ kind: "whatsnew" });
      void patchSettings({ lastSeenVersion: version });
      return true;
    };
    if (show()) return;
    const onVisible = () => {
      if (show()) document.removeEventListener("visibilitychange", onVisible);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [version, seen, onboarded]);
}

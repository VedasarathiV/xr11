import { useEffect, useState } from "react";
import { Field, TextField } from "../../components/Controls";
import { Icon } from "../../design/icons";
import { api } from "../../lib/api";
import { formatBytes } from "../../lib/format";
import { t } from "../../lib/i18n";
import type { HfContext, HfHit, HfPresent, HfRepo, HfRepoFile } from "../../lib/types";
import { fullPath } from "../../lib/paths";
import { attempt, toast } from "../../lib/ui";
import { pickFolder } from "../../lib/win";

function count(n?: number | null) {
  return n == null ? "" : new Intl.NumberFormat(undefined, { notation: n > 999_999 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);
}

function repoError(e: unknown) {
  const code = String(e instanceof Error ? e.message : e);
  const messages: Record<string, string> = {
    "hf:notFound": "Hugging Face has no model with this name.",
    "hf:needsToken": "Not found. If it’s a private or gated model, add your Hugging Face access token below.",
    "hf:badToken": "Hugging Face didn’t accept the access token.",
    "hf:gated": "This model is gated: accept its terms on its Hugging Face page, then try again.",
    "hf:rateLimited": "Hugging Face asks to slow down. Try again in a minute.",
    "hf:network": "Couldn’t reach Hugging Face. Check the connection, or the server in Settings › AI models.",
    "hf:server": "Hugging Face didn’t answer as expected. Try again later.",
  };
  return t(messages[code] ?? code);
}

function lmStudioRepoFolder(root: string, repo: HfRepo) {
  const base = repo.kind === "dataset" ? fullPath(root, "datasets") : root;
  const [owner, name] = repo.id.split("/");
  return fullPath(fullPath(base, owner), name);
}

export function HfModelsSheet() {
  const [ctx, setCtx] = useState<HfContext | null>(null);
  const [search, setSearch] = useState("");
  const [hits, setHits] = useState<HfHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [input, setInput] = useState("");
  const [repo, setRepo] = useState<HfRepo | null>(null);
  const [present, setPresent] = useState<HfPresent>({ onDisk: [], listed: [] });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fileSearch, setFileSearch] = useState("");
  const [destination, setDestination] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [endpoint, setEndpoint] = useState("https://huggingface.co");
  const [token, setToken] = useState("");
  const [modelRoot, setModelRoot] = useState("");
  const [directUrl, setDirectUrl] = useState("");

  const searchModels = async (q: string) => {
    setSearching(true);
    try {
      setHits(await api.hfSearch(q));
    } catch (e) {
      setError(repoError(e));
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    void api.hfContext().then((value) => {
      setCtx(value);
      setEndpoint(value.endpoint);
      setModelRoot(value.folder);
    }).catch((e) => setError(repoError(e)));
    void searchModels("");
  }, []);

  const openRepo = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError("");
    setRepo(null);
    setInput(trimmed);
    try {
      const result = await api.hfRepo(trimmed);
      setRepo(result);
      setDestination(result.folder);
      setFileSearch("");
      const initial = new Set(result.suggestion.files);
      if (result.suggestion.variant) {
        const choice = result.suggestion.variants.find((v) => v.label === result.suggestion.variant);
        if (choice) {
          initial.clear();
          [...choice.files, ...result.suggestion.extras].forEach((f) => initial.add(f));
        }
      }
      setSelected(initial);
      const p = await api.hfPresent({ kind: result.kind, id: result.id, sha: result.sha, folder: result.folder, files: result.files });
      setPresent(p);
      for (const f of [...p.onDisk, ...p.listed]) initial.delete(f);
      setSelected(new Set(initial));
    } catch (e) {
      setError(repoError(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleFile = (path: string) => setSelected((old) => {
    const next = new Set(old);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    return next;
  });

  const pickVariant = (label: string) => {
    if (!repo) return;
    const variant = repo.suggestion.variants.find((v) => v.label === label);
    if (!variant) return;
    setSelected(new Set([...variant.files, ...repo.suggestion.extras]));
  };

  const visibleFiles = repo?.files.filter((f) => f.path.toLowerCase().includes(fileSearch.toLowerCase())).slice(0, 240) ?? [];
  const selectedFiles = repo?.files.filter((f) => selected.has(f.path)) ?? [];
  const selectedBytes = selectedFiles.reduce((sum, f) => sum + f.size, 0);

  const download = async () => {
    if (!repo || !selectedFiles.length || busy) return;
    setBusy(true);
    const n = await attempt(api.hfAdd({ kind: repo.kind, id: repo.id, sha: repo.sha, files: selectedFiles, folder: destination }), t("Could not add the model downloads"));
    setBusy(false);
    if (n) {
      toast(t("Model files added to the AI models queue"), { kind: "success", body: t("{count} files · {size}", { count: n, size: formatBytes(selectedBytes) }) });
    }
  };

  const saveOptions = async () => {
    const huggingFace: { endpoint: string; folder: string; token?: string } = { endpoint: endpoint.trim(), folder: modelRoot.trim() };
    if (token.trim()) huggingFace.token = token.trim();
    const updated = await attempt(api.updateSettings({ huggingFace }), t("Could not save model settings"));
    if (!updated) return;
    setToken("");
    const next = await api.hfContext();
    setCtx(next);
    setEndpoint(next.endpoint);
    setModelRoot(next.folder);
    toast(t("Model settings saved"), { kind: "success" });
  };

  const clearToken = async () => {
    const updated = await attempt(api.updateSettings({ huggingFace: { endpoint: endpoint.trim(), folder: modelRoot.trim(), token: "" } }), t("Could not clear the saved token"));
    if (!updated) return;
    setToken("");
    const next = await api.hfContext();
    setCtx(next);
  };

  const folderForModel = async () => {
    const folder = await pickFolder(destination || ctx?.folder);
    if (folder) setDestination(folder);
  };

  const addDirectModelUrl = async () => {
    const url = directUrl.trim();
    if (!url || busy) return;
    setBusy(true);
    const capture = await attempt(api.addUrl({ url, category: "models", saveDir: ctx?.folder }), t("Could not add the model link"));
    setBusy(false);
    if (capture) {
      setDirectUrl("");
      toast(t("Model link sent to the download dialog"), { kind: "success" });
    }
  };

  const openSource = async (url: string) => {
    await attempt(api.openExternalUrl(url), t("Could not open the model source"));
  };

  return (
    <div className="hf-sheet">
      <div className="hf-sheet__intro">
        <div><b>{t("Find and download local models")}</b><span>{t("Browse Hugging Face models, choose a model format, and add verified files to a dedicated download queue.")}</span></div>
        <button type="button" className="btn btn--sm" onClick={() => setShowSettings((v) => !v)}><Icon name="options" size={14} />{t("Model settings")}</button>
      </div>
      <section className="hf-other-sources">
        <div className="hf-other-sources__head">
          <b>{t("More model sources")}</b>
          <span>{t("Open a source, copy a direct file download link, then add it here.")}</span>
        </div>
        <div className="hf-other-sources__links">
          <button type="button" className="btn btn--sm" onClick={() => void openSource("https://www.modelscope.cn/models")}>ModelScope</button>
          <button type="button" className="btn btn--sm" onClick={() => void openSource("https://www.kaggle.com/models")}>Kaggle Models</button>
          <button type="button" className="btn btn--sm" onClick={() => void openSource("https://github.com/search?type=repositories&q=llm+weights")}>GitHub</button>
          <button type="button" className="btn btn--sm" onClick={() => void openSource("https://ollama.com/library")}>Ollama Library</button>
        </div>
        <div className="hf-other-sources__input">
          <TextField value={directUrl} onChange={setDirectUrl} label={t("Direct model file URL")} icon="download" mono placeholder="https://…/resolve/main/model.safetensors" onEnter={() => void addDirectModelUrl()} />
          <button type="button" className="btn btn--primary btn--sm" disabled={busy || !directUrl.trim()} onClick={() => void addDirectModelUrl()}>{t("Add model link")}</button>
        </div>
        <p>{t("Direct model files are grouped under AI models. Kaggle may ask for account credentials. Ollama model names are installed with ollama pull; xr11 downloads files but does not run models.")}</p>
      </section>
      {showSettings && (
        <section className="hf-settings">
          <Field label={t("Hugging Face endpoint")}><TextField value={endpoint} onChange={setEndpoint} label={t("Hugging Face endpoint")} icon="globe" mono placeholder="https://huggingface.co" /></Field>
          <Field label={t("Models folder")}><TextField value={modelRoot} onChange={setModelRoot} label={t("Models folder")} icon="folder" mono placeholder={ctx?.folder ?? "~/Downloads/Models"} /></Field>
          <Field label={t("Hugging Face access token")} hint={ctx?.token ? t("A token is already available from {source}.", { source: ctx.token }) : t("Needed only for gated or private models.")}>
            <TextField value={token} onChange={setToken} label={t("Hugging Face access token")} type="password" icon="key" placeholder={t("Paste a read token; it is never included in download URLs.")} />
          </Field>
          <div className="hf-settings__actions">
            {ctx?.token === "settings" && <button type="button" className="btn btn--ghost" onClick={() => void clearToken()}>{t("Clear saved token")}</button>}
            <button type="button" className="btn btn--primary" onClick={() => void saveOptions()}>{t("Save settings")}</button>
          </div>
        </section>
      )}
      <div className="hf-searchbar">
        <div className="hf-searchbar__search"><TextField value={search} onChange={setSearch} label={t("Search models")} icon="search" placeholder={t("Search model repositories by name")} onEnter={() => void searchModels(search)} /><button type="button" className="btn" disabled={searching} onClick={() => void searchModels(search)}>{searching ? t("Searching…") : t("Search")}</button></div>
        <div className="hf-searchbar__repo"><TextField value={input} onChange={setInput} label={t("Model name or Hugging Face link")} icon="model" mono placeholder="owner/model or https://huggingface.co/owner/model" onEnter={() => void openRepo(input)} /><button type="button" className="btn btn--primary" disabled={busy || !input.trim()} onClick={() => void openRepo(input)}>{busy ? t("Loading…") : t("Open model")}</button></div>
      </div>
      {error && <div className="hf-error"><Icon name="warning" size={15} />{error}</div>}
      <div className="hf-workspace">
        <aside className="hf-catalog">
          <div className="hf-catalog__head">{search ? t("Search results") : t("Trending on Hugging Face")}</div>
          {hits.map((hit) => <button type="button" key={hit.id} className={`hf-hit${repo?.id === hit.id ? " on" : ""}`} onClick={() => void openRepo(hit.id)}>
            <Icon name={hit.gguf ? "file-code" : "model"} size={16} />
            <span className="hf-hit__name">{hit.id}<small>{hit.pipelineTag ?? t("AI model")}{hit.gated ? ` · ${t("Gated")}` : ""}</small></span>
            <span className="hf-hit__stats">{count(hit.downloads)}<small>{t("downloads")}</small></span>
          </button>)}
          {!hits.length && !searching && <p className="t-small">{t("No models found. Try another search.")}</p>}
        </aside>
        <section className="hf-detail">
          {!repo ? <div className="hf-empty"><span className="hf-empty__icon"><Icon name="model" size={24} /></span><b>{t("Choose a model to inspect its files")}</b><p>{t("xr11 supports Hugging Face LLM repositories, including GGUF and safetensors weights. Downloads are saved locally; xr11 does not run the model.")}</p></div> : <>
            <div className="hf-repo-head"><div className="hf-repo-head__copy"><b>{repo.id}</b><span>{repo.pipelineTag ?? repo.library ?? t("Model repository")} · {t("{count} files", { count: repo.files.length })}{repo.downloads ? ` · ${count(repo.downloads)} ${t("downloads")}` : ""}</span></div><a className="btn btn--sm" href={repo.pageUrl} target="_blank" rel="noreferrer">{t("Open on Hugging Face")} <Icon name="external" size={13} /></a></div>
            {(repo.gated || repo.private) && <div className="hf-notice"><Icon name="warning" size={15} />{t("This model may need access approval and a Hugging Face read token.")}</div>}
            {repo.suggestion.variants.length > 0 && <div className="hf-variants"><span className="field__label">{t("GGUF quantization · smaller files use less memory")}</span><div className="hf-chips">{repo.suggestion.variants.map((v) => <button type="button" key={v.label} className={`hf-chip${v.files.some((f) => selected.has(f)) ? " on" : ""}`} onClick={() => pickVariant(v.label)}><b>{v.label}</b><span>{formatBytes(v.size)}</span></button>)}</div></div>}
            <div className="hf-files-head"><b>{t("Model files")}</b><span>{t("{count} selected · {size}", { count: selectedFiles.length, size: formatBytes(selectedBytes) })}</span><TextField value={fileSearch} onChange={setFileSearch} label={t("Filter model files")} icon="search" placeholder={t("Filter files")} /><button type="button" className="btn btn--ghost btn--sm" onClick={() => setSelected(new Set(repo.suggestion.files))}>{t("Select recommended")}</button></div>
            <div className="hf-file-list">{visibleFiles.map((file) => <ModelFile key={file.path} file={file} selected={selected.has(file.path)} present={present.onDisk.includes(file.path) ? "disk" : present.listed.includes(file.path) ? "queue" : null} onToggle={() => toggleFile(file.path)} />)}{repo.files.length > visibleFiles.length && <div className="hf-more">{t("Showing {shown} of {total}; filter by name to find other files.", { shown: visibleFiles.length, total: repo.files.length })}</div>}</div>
            <div className="hf-destination"><Icon name="folder" size={15} /><span title={destination}>{destination}</span><button type="button" className="btn btn--sm" onClick={() => void folderForModel()}>{t("Choose folder")}</button>{ctx?.lmStudio && <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDestination(lmStudioRepoFolder(ctx.lmStudio!, repo))}>{t("Use LM Studio folder")}</button>}</div>
          </>}
        </section>
      </div>
      <footer className="hf-footer"><span>{t("Model files download through xr11’s normal queue with resume and checksum verification.")}</span><button type="button" className="btn btn--primary" disabled={!repo || !selectedFiles.length || busy} onClick={() => void download()}><Icon name="download" size={15} />{busy ? t("Adding…") : t("Download selected ({count})", { count: selectedFiles.length })}</button></footer>
    </div>
  );
}

function ModelFile({ file, selected, present, onToggle }: { file: HfRepoFile; selected: boolean; present: "disk" | "queue" | null; onToggle: () => void }) {
  return <button type="button" className={`hf-file${selected ? " on" : ""}`} aria-pressed={selected} disabled={!!present} onClick={onToggle}>
    <span className="hf-file__check"><Icon name={selected ? "check" : present ? "status-completed" : "file"} size={14} /></span><span className="hf-file__name" title={file.path}>{file.path}</span><span className="hf-file__state">{present === "disk" ? t("Downloaded") : present === "queue" ? t("Already in queue") : ""}</span><span className="hf-file__size">{formatBytes(file.size)}</span>
  </button>;
}

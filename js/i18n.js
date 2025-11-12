(() => {
  const SUPPORTED = ["fr", "en"];
  const DEFAULT_LANG = "fr";

  const getParamLang = () => new URLSearchParams(location.search).get("lang");
  const getStoredLang = () => localStorage.getItem("lang");
  const getBrowserLang = () => (navigator.language || "fr").slice(0, 2).toLowerCase();

  const pickLang = () => {
    const q = getParamLang();
    if (q && SUPPORTED.includes(q)) return q;

    const s = getStoredLang();
    if (s && SUPPORTED.includes(s)) return s;

    const b = getBrowserLang();
    return SUPPORTED.includes(b) ? b : DEFAULT_LANG;
  };

  const state = { lang: pickLang(), dict: null };

  const loadDict = async (lang) => {
    const dictUrl = new URL(`./i18n/${lang}.json`, window.location.href);
    const res = await fetch(dictUrl.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`i18n load failed: ${lang}`);
    return res.json();
  };

  const applyMeta = (dict) => {
    const page = document.body.getAttribute("data-page") || "home";
    const t = dict[`meta.title.${page}`];
    const d = dict[`meta.desc.${page}`];

    if (t) document.title = t;

    if (d) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", d);
    }

    document.documentElement.setAttribute("lang", state.lang);
  };

  const applyText = (dict) => {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;

      const v = dict[key];
      if (typeof v === "string") {
        if (el.hasAttribute("data-i18n-no-text")) return;
        const mode = el.getAttribute("data-i18n-mode");
        if (mode === "html") {
          el.innerHTML = v;
        } else {
          el.textContent = v;
        }
      }
    });

    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const attrs = el.getAttribute("data-i18n-attr").split("|").map((attr) => attr.trim()).filter(Boolean);
      if (!attrs.length) return;

      const key = el.getAttribute("data-i18n");
      if (!key) return;

      const v = dict[key];
      if (typeof v === "string") {
        attrs.forEach((attr) => el.setAttribute(attr, v));
        return;
      }

      if (typeof v !== "object" || v === null) return;

      attrs.forEach((attr) => {
        if (v[attr]) el.setAttribute(attr, v[attr]);
      });
    });
  };

  const rewriteLinks = () => {
    const isInternal = (href) => {
      if (!href) return false;
      return !href.startsWith("http") && !href.startsWith("#") && !href.startsWith("mailto:") && !href.startsWith("tel:");
    };

    document.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!isInternal(href)) return;

      const url = new URL(href, location.origin);
      url.searchParams.set("lang", state.lang);
      a.setAttribute("href", `${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ""}${url.hash}`);
    });

    const url = new URL(location.href);
    url.searchParams.set("lang", state.lang);
    history.replaceState({}, "", `${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ""}${url.hash}`);
  };

  const render = async (forceLang) => {
    if (forceLang) state.lang = forceLang;

    state.dict = await loadDict(state.lang);
    applyMeta(state.dict);
    applyText(state.dict);
    rewriteLinks();
    localStorage.setItem("lang", state.lang);
    document.documentElement.classList.add("i18n-ready");
    document.dispatchEvent(new CustomEvent("i18n:updated", { detail: { lang: state.lang } }));
  };

  window.__i18n = {
    setLang: (lang) => {
      if (!SUPPORTED.includes(lang) || lang === state.lang) return;
      render(lang).catch(console.error);
    },
    getLang: () => state.lang,
    t: (key, fallback = "") => {
      if (state.dict && typeof state.dict[key] === "string") return state.dict[key];
      if (state.dict && typeof state.dict[key] === "number") return String(state.dict[key]);
      return fallback || key;
    },
  };

  render().catch(console.error);
})();

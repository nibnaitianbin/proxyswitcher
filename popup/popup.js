const MENU_ICONS = {
  none: '<svg viewBox="0 0 20 20" width="20" height="20"><circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="2.2" fill="none"/><path d="M5 5 L15 15 M15 5 L5 15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  autoDetect: '<svg viewBox="0 0 20 20" width="20" height="20"><circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="2.2" fill="none"/><path d="M15 5 A7 7 0 1 1 10 16" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/><polygon points="15,5 8,9 13,7" fill="currentColor"/></svg>',
  system: '<svg viewBox="0 0 20 20" width="20" height="20"><rect x="1.5" y="3" width="17" height="12" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><rect x="6.5" y="15" width="7" height="3" rx="1" fill="currentColor"/></svg>',
  manual: '<svg viewBox="0 0 20 20" width="20" height="20"><circle cx="11" cy="4.5" r="2.5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M9 10 L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M11 7.5 L11 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M13 10 L13 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6.5 14 Q10 19 15.5 14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  autoConfig: '<svg viewBox="0 0 20 20" width="20" height="20"><circle cx="6.5" cy="10" r="4.5" stroke="currentColor" stroke-width="2.2" fill="none"/><circle cx="13.5" cy="10" r="4.5" stroke="currentColor" stroke-width="2.2" fill="none"/></svg>',
};

const CHECKMARK_SVG = '<svg viewBox="0 0 14 14" width="14" height="14"><polyline points="3,7 6,10 11,4" stroke="#0060df" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const PROXY_MODES = [
  { key: "none",       label: browser.i18n.getMessage("proxyModeNone"),       icon: MENU_ICONS.none },
  { key: "autoDetect", label: browser.i18n.getMessage("proxyModeAutoDetect"), icon: MENU_ICONS.autoDetect },
  { key: "system",     label: browser.i18n.getMessage("proxyModeSystem"),     icon: MENU_ICONS.system },
  { key: "manual",     label: browser.i18n.getMessage("proxyModeManual"),     icon: MENU_ICONS.manual },
  { key: "autoConfig", label: browser.i18n.getMessage("proxyModeAutoConfig"), icon: MENU_ICONS.autoConfig },
];

async function getCurrentProxyMode() {
  const response = await browser.runtime.sendMessage({ action: "getProxyMode" });
  if (response.error) {
    throw new Error(response.error);
  }
  return response.proxyType;
}

async function setProxyMode(mode) {
  const response = await browser.runtime.sendMessage({ action: "setProxyMode", proxyType: mode });
  if (!response.success) {
    throw new Error(response.error || "Unknown error");
  }
}

function showError(message) {
  const bar = document.getElementById("error-bar");
  bar.textContent = message;
  bar.classList.add("visible");
}

function clearError() {
  const bar = document.getElementById("error-bar");
  bar.classList.remove("visible");
  bar.textContent = "";
}

function renderModeList(currentMode) {
  const list = document.getElementById("mode-list");
  list.innerHTML = "";

  PROXY_MODES.forEach(({ key, label, icon }) => {
    const item = document.createElement("div");
    item.className = "menu-item";
    if (key === currentMode) {
      item.classList.add("active");
    }

    const checkmark = document.createElement("span");
    checkmark.className = "menu-checkmark";
    checkmark.insertAdjacentHTML("beforeend", CHECKMARK_SVG);

    const iconSpan = document.createElement("span");
    iconSpan.className = "menu-icon";
    iconSpan.insertAdjacentHTML("beforeend", icon);

    const text = document.createElement("span");
    text.className = "menu-label";
    text.textContent = label;

    item.appendChild(checkmark);
    item.appendChild(iconSpan);
    item.appendChild(text);

    item.addEventListener("click", () => onModeClick(key, item));

    list.appendChild(item);
  });
}

async function onModeClick(modeKey, clickedElement) {
  clearError();
  const currentActive = document.querySelector(".menu-item.active");

  if (currentActive === clickedElement) {
    return;
  }

  clickedElement.classList.add("switching");

  try {
    await setProxyMode(modeKey);
  } catch (err) {
    clickedElement.classList.remove("switching");
    showError(err.message);
    return;
  }

  clickedElement.classList.remove("switching");

  if (currentActive) {
    currentActive.classList.remove("active");
  }
  clickedElement.classList.add("active");

  setTimeout(() => window.close(), 120);
}

(async function init() {
  try {
    const currentMode = await getCurrentProxyMode();
    renderModeList(currentMode);
  } catch (err) {
    console.error("ProxySwitcher: failed to read current proxy mode", err);
    renderModeList(null);
    showError(err.message);
  }
})();

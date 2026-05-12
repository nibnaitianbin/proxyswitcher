const MODE_ICONS = {
  none:       { 16: "icons/mode-none-16.png",       32: "icons/mode-none-32.png" },
  autoDetect: { 16: "icons/mode-autoDetect-16.png", 32: "icons/mode-autoDetect-32.png" },
  system:     { 16: "icons/mode-system-16.png",     32: "icons/mode-system-32.png" },
  manual:     { 16: "icons/mode-manual-16.png",     32: "icons/mode-manual-32.png" },
  autoConfig: { 16: "icons/mode-autoConfig-16.png", 32: "icons/mode-autoConfig-32.png" },
};

function updateToolbar(mode) {
  const icons = MODE_ICONS[mode];
  if (icons) {
    browser.action.setIcon({ path: icons });
  }
  browser.action.setTitle({ title: browser.i18n.getMessage("tooltip" + mode[0].toUpperCase() + mode.slice(1)) || "ProxySwitcher" });
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getProxyMode") {
    browser.proxy.settings.get({ incognito: false }).then(
      (result) => {
        updateToolbar(result.value.proxyType);
        sendResponse({ proxyType: result.value.proxyType });
      },
      (err) => sendResponse({ error: err.message })
    );
    return true;
  }

  if (message.action === "setProxyMode") {
    browser.proxy.settings.get({ incognito: false }).then((result) => {
      const fullConfig = Object.assign({}, result.value, { proxyType: message.proxyType });
      if (message.proxyType === "autoConfig" && !fullConfig.autoConfigUrl) {
        throw new Error(browser.i18n.getMessage("errorAutoConfigUrlMissing"));
      }
      return browser.proxy.settings.set({ value: fullConfig });
    }).then(() => {
      updateToolbar(message.proxyType);
      sendResponse({ success: true });
    }).catch(
      (err) => sendResponse({ success: false, error: err.message })
    );
    return true;
  }
});

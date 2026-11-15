// The disk cache is 1 GB, not Firefox's smaller smart size, as revisits load from it instead of the network.
const capacity = Services.prefs.getIntPref("browser.cache.disk.capacity");
const smart = Services.prefs.getBoolPref("browser.cache.disk.smart_size.enabled");
return { ok: capacity === 1048576 && !smart, capacity, smart };

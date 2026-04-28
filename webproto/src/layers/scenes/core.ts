
export const DEBUG = new (class {
  params = new URLSearchParams(globalThis.location.search);
  debug = new Set((this.params.get("debug") ?? "") ?.split(","));
  hide = new Set((this.params.get("hide") ?? "") ?.split(","));


  // ICONS = !this.debug.has("icons");
  // DEBUG_EVENTS = this.debug.has("events");

  // HIDE_PLACES = this.hide.has("places");
  // HIDE_EVENTS = this.hide.has("events");
})()

console.info("DEBUG FLAGS: ", DEBUG)


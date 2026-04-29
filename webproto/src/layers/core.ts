
export const DEBUG = new (class {
  params = new URLSearchParams(globalThis.location.search);
  debug = new Set((this.params.get("debug") ?? "") ?.split(","));
  hide = new Set((this.params.get("hide") ?? "") ?.split(","));

  // mocked features
  mock = this.params.get("place");
  getMockedPlace(): Place | null {
    // Mock features (admin testing feature)
    if (!this.mock)
      return null;

    const place = JSON.parse(this.mock) as Place;

    if (!(place.coord && place.name))
      console.error("Mocked place lacks required attributes!", place);

    return place;
  }

  filters = {
    type: new Set((this.params.get("type") ?? "") ?.split(",")),
    open: new Set((this.params.get("open") ?? "") ?.split(",")),
  };

  filterFeature(place: Place): boolean {

    
  }
})()

console.info("DEBUG FLAGS: ", DEBUG)


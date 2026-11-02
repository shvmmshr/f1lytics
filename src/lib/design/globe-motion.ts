export interface GlobeMotion {
  initialized: boolean;
  reducedMotion: boolean;
  playing: boolean;
}

// Keep the server and first browser frame still until the preference is known.
export const INITIAL_GLOBE_MOTION: GlobeMotion = {
  initialized: false,
  reducedMotion: true,
  playing: false,
};

export function globeMotion(
  state: GlobeMotion,
  action: { type: "preference"; reducedMotion: boolean } | { type: "toggle" },
): GlobeMotion {
  if (action.type === "toggle") {
    return { ...state, initialized: true, playing: !state.playing };
  }
  return {
    initialized: true,
    reducedMotion: action.reducedMotion,
    // A new reduced-motion request always stops rotation. Removing the
    // preference does not undo an existing pause or start motion unexpectedly.
    playing: action.reducedMotion ? false : state.initialized ? state.playing : true,
  };
}

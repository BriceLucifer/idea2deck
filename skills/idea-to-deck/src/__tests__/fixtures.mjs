export function sampleDeck(overrides = {}) {
  return {
    version: "1.0",
    approval: {
      confirmed: true,
      confirmedAt: "2026-07-14T00:00:00.000Z",
      summary: "Approved ten-slide product introduction.",
    },
    deck: {
      slug: "sample-deck",
      title: "Sample Deck",
      audience: "Product leaders",
      language: "en-NZ",
      objective: "Explain the product clearly.",
      aspectRatio: "16:9",
      width: 1920,
      height: 1080,
      quality: "high",
      theme: {},
    },
    sources: [],
    slides: [{
      id: "slide-1",
      title: "A clear opening",
      purpose: "Introduce the central idea.",
      speakerNotes: "Open with the user problem.",
      elements: [{
        id: "title",
        type: "text",
        x: 120,
        y: 120,
        w: 1200,
        h: 180,
        zIndex: 1,
        allowOverlap: false,
        editable: true,
        text: "A clear opening",
        style: { fontSize: 54, bold: true, align: "left", valign: "top", margin: 0, italic: false, breakLine: false },
      }],
    }],
    ...overrides,
  };
}

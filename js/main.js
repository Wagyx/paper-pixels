import { EditorApplication } from "./application/EditorApplication.js";
import { EditorState } from "./model/EditorState.js";
import { connectorSlotCount } from "./model/connectors.js";
import { APP_VERSION, PIECE_TYPES } from "./config.js";
import { SvgVisualization } from "./visualization/SvgVisualization.js";

for (const type of Object.keys(PIECE_TYPES)) {
  const def = PIECE_TYPES[type];
  const expected = connectorSlotCount(type);
  if (!def.variants?.length) {
    console.error(`Piece "${type}": at least one variant is required.`);
    continue;
  }
  def.variants.forEach((variant, index) => {
    if (!variant.connectors || variant.connectors.length !== expected) {
      console.error(
        `Piece "${type}" variant "${variant.name}" (#${index}): connectors must have ${expected} values (got ${variant.connectors?.length ?? 0}).`
      );
    }
  });
}

const appVersionEl = document.getElementById("appVersion");
if (appVersionEl) appVersionEl.textContent = `v${APP_VERSION}`;

const state = new EditorState();
const visualization = new SvgVisualization(document.getElementById("gridSvg"));

new EditorApplication(state, visualization, {
  svg: document.getElementById("gridSvg"),
  pieceButtons: document.querySelectorAll(".piece-btn"),
  selectionTools: document.getElementById("selectionTools"),
  colorPanel: document.getElementById("colorPanel"),
  colorPicker: document.getElementById("colorPicker"),
  deleteBtn: document.getElementById("deleteBtn"),
  recenterBtn: document.getElementById("recenterBtn"),
  showConnectorsCheckbox: document.getElementById("showConnectors"),
  showGridCheckbox: document.getElementById("showGrid"),
  solveBtn: document.getElementById("solveBtn"),
  summaryBtn: document.getElementById("summaryBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  importFileInput: document.getElementById("importFileInput"),
});

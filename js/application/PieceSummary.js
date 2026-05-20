import { buildPiecesSummary, getTotalPieceCount } from "../model/pieceSummary.js";
import { PIECE_TYPE_ORDER } from "../config.js";
import { createVariantPreviewSvg } from "../visualization/variantPreview.js";

export class PieceSummary {
  /**
   * @param {() => object[]} getPieces
   */
  constructor(getPieces) {
    this.getPieces = getPieces;

    this.dialog = document.createElement("dialog");
    this.dialog.className = "summary-dialog";
    this.dialog.innerHTML = `
      <div class="summary-dialog-panel">
        <header class="summary-dialog-header">
          <h2 class="summary-dialog-title">Pieces summary</h2>
          <button type="button" class="btn summary-dialog-close" aria-label="Close">×</button>
        </header>
        <p class="summary-dialog-total" id="summaryTotal"></p>
        <div class="summary-dialog-body" id="summaryBody"></div>
      </div>
    `;
    document.body.appendChild(this.dialog);

    this.totalEl = this.dialog.querySelector("#summaryTotal");
    this.bodyEl = this.dialog.querySelector("#summaryBody");
    this.dialog.querySelector(".summary-dialog-close").addEventListener("click", () =>
      this.close()
    );
    this.dialog.addEventListener("click", (e) => {
      if (e.target === this.dialog) this.close();
    });
  }

  open() {
    this.render();
    this.dialog.showModal();
  }

  close() {
    this.dialog.close();
  }

  render() {
    const pieces = this.getPieces();
    const rows = buildPiecesSummary(pieces);
    const total = getTotalPieceCount(pieces);

    this.totalEl.textContent =
      total === 0
        ? "No pieces on the board."
        : `${total} piece${total === 1 ? "" : "s"} on the board. Variants that match by rotation are grouped together.`;

    this.bodyEl.replaceChildren();

    if (rows.length === 0) {
      const empty = document.createElement("p");
      empty.className = "summary-empty";
      empty.textContent = "Place pieces on the grid to see a summary.";
      this.bodyEl.appendChild(empty);
      return;
    }

    let currentType = null;
    let section = null;
    let list = null;

    for (const row of rows) {
      if (row.type !== currentType) {
        currentType = row.type;
        section = document.createElement("section");
        section.className = "summary-type-section";

        const heading = document.createElement("h3");
        heading.className = "summary-type-heading";
        heading.textContent = row.typeLabel;
        section.appendChild(heading);

        list = document.createElement("ul");
        list.className = "summary-list";
        section.appendChild(list);

        this.bodyEl.appendChild(section);
      }

      const item = document.createElement("li");
      item.className = "summary-item";

      const preview = document.createElement("span");
      preview.className = "summary-item-preview";
      preview.appendChild(
        createVariantPreviewSvg(row.type, row.representativeIndex)
      );

      const details = document.createElement("span");
      details.className = "summary-item-details";

      const variantLine = document.createElement("span");
      variantLine.className = "summary-item-variant";
      variantLine.textContent = `Variant ${row.variantLabel}`;

      const colorLine = document.createElement("span");
      colorLine.className = "summary-item-color";
      const swatch = document.createElement("span");
      swatch.className = "summary-color-swatch";
      swatch.style.backgroundColor = row.color;
      colorLine.append(swatch, document.createTextNode(row.color));

      details.append(variantLine, colorLine);

      const count = document.createElement("span");
      count.className = "summary-item-count";
      count.textContent = `× ${row.count}`;

      item.append(preview, details, count);
      list.appendChild(item);
    }

    const missingTypes = PIECE_TYPE_ORDER.filter(
      (type) => !rows.some((row) => row.type === type)
    );
    if (missingTypes.length > 0 && rows.length > 0) {
      const note = document.createElement("p");
      note.className = "summary-footnote";
      note.textContent = `Types not on the board: ${missingTypes.map((t) => t.replace("x", "×")).join(", ")}.`;
      this.bodyEl.appendChild(note);
    }
  }
}

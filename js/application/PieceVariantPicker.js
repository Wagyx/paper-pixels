import { PIECE_TYPES } from "../config.js";
import { createVariantPreviewSvg } from "../visualization/variantPreview.js";

export class PieceVariantPicker {
  /**
   * @param {import("../model/EditorState.js").EditorState} state
   * @param {NodeListOf<HTMLButtonElement>} pieceButtons
   * @param {() => void} onChange
   */
  constructor(state, pieceButtons, onChange) {
    this.state = state;
    this.pieceButtons = pieceButtons;
    this.onChange = onChange;
    this.openType = null;

    const panel = document.querySelector(".piece-panel");
    this.variantStrip = document.createElement("div");
    this.variantStrip.id = "variantStrip";
    this.variantStrip.className = "variant-strip hidden";
    this.variantStrip.setAttribute("role", "listbox");
    this.variantStrip.setAttribute("aria-label", "Connector variant");
    panel?.appendChild(this.variantStrip);

    this.bindButtons();
    this.updateAllButtonThumbs();
  }

  bindButtons() {
    this.pieceButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const type = btn.dataset.type;
        const def = PIECE_TYPES[type];

        if (def.variants.length === 1) {
          this.openType = null;
          this.hideVariantStrip();
          this.selectVariant(type, 0);
          return;
        }

        if (this.openType === type) {
          this.openType = null;
          this.hideVariantStrip();
          this.syncActiveButtons();
          return;
        }

        this.openType = type;
        this.state.setActiveType(type);
        this.renderVariantStrip(type);
        this.syncActiveButtons();
        this.onChange();
      });
    });
  }

  hideVariantStrip() {
    if (!this.variantStrip) return;
    this.variantStrip.classList.add("hidden");
    this.variantStrip.replaceChildren();
  }

  renderVariantStrip(type) {
    if (!this.variantStrip) return;

    const def = PIECE_TYPES[type];
    this.variantStrip.replaceChildren();

    if (!def || def.variants.length <= 1) {
      this.hideVariantStrip();
      return;
    }

    this.variantStrip.classList.remove("hidden");

    def.variants.forEach((variant, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "variant-option";
      option.setAttribute("role", "option");
      option.dataset.variantIndex = String(index);
      option.title = variant.name;
      option.setAttribute("aria-label", variant.name);

      const isActive =
        this.state.activeType === type &&
        this.state.getActiveVariantIndex(type) === index;
      option.classList.toggle("active", isActive);
      option.setAttribute("aria-selected", String(isActive));

      const previewWrap = document.createElement("span");
      previewWrap.className = "variant-option-preview";
      previewWrap.appendChild(createVariantPreviewSvg(type, index));
      option.append(previewWrap);

      option.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this.selectVariant(type, index);
      });

      this.variantStrip.appendChild(option);
    });
  }

  close() {
    this.openType = null;
    this.hideVariantStrip();
  }

  selectVariant(type, variantIndex) {
    this.state.setActiveVariant(type, variantIndex);
    this.state.setActiveType(type);
    this.updateAllButtonThumbs();
    this.onChange();
  }

  updateButtonThumb(btn) {
    const type = btn.dataset.type;
    const thumb = btn.querySelector(".piece-thumb");
    if (!thumb) return;
    thumb.replaceChildren();
    const index = this.state.getActiveVariantIndex(type);
    thumb.appendChild(createVariantPreviewSvg(type, index));
  }

  updateAllButtonThumbs() {
    this.pieceButtons.forEach((btn) => this.updateButtonThumb(btn));
    if (this.openType) {
      this.renderVariantStrip(this.openType);
    }
  }

  syncActiveButtons() {
    this.pieceButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.type === this.state.activeType);
    });
  }
}

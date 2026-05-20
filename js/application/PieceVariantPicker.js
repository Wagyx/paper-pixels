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

    this.dropdown = document.createElement("div");
    this.dropdown.id = "variantDropdown";
    this.dropdown.className = "variant-dropdown hidden";
    this.dropdown.setAttribute("role", "listbox");
    this.dropdown.innerHTML = `
      <p class="variant-dropdown-title"></p>
      <div class="variant-dropdown-list"></div>
    `;
    this.titleEl = this.dropdown.querySelector(".variant-dropdown-title");
    this.listEl = this.dropdown.querySelector(".variant-dropdown-list");
    document.body.appendChild(this.dropdown);

    this.bindButtons();
    this.bindDismiss();
    this.updateAllButtonThumbs();
  }

  bindButtons() {
    this.pieceButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const type = btn.dataset.type;
        const def = PIECE_TYPES[type];

        if (def.variants.length === 1) {
          this.selectVariant(type, 0);
          return;
        }

        if (this.openType === type) {
          this.close();
          return;
        }

        this.open(type, btn);
      });
    });
  }

  bindDismiss() {
    document.addEventListener("mousedown", (e) => {
      if (this.dropdown.classList.contains("hidden")) return;
      const inDropdown = this.dropdown.contains(e.target);
      const onButton = [...this.pieceButtons].some((b) => b.contains(e.target));
      if (!inDropdown && !onButton) this.close();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.close();
    });

    window.addEventListener("resize", () => {
      if (this.openType) {
        const btn = [...this.pieceButtons].find(
          (b) => b.dataset.type === this.openType
        );
        if (btn) this.positionDropdown(btn);
      }
    });
  }

  open(type, anchorBtn) {
    const def = PIECE_TYPES[type];
    this.openType = type;
    this.titleEl.textContent = type.replace("x", "×");
    this.listEl.replaceChildren();

    def.variants.forEach((variant, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "variant-option";
      option.setAttribute("role", "option");
      option.dataset.variantIndex = String(index);

      const isActive =
        this.state.activeType === type &&
        this.state.getActiveVariantIndex(type) === index;
      option.classList.toggle("active", isActive);
      option.setAttribute("aria-selected", String(isActive));

      const previewWrap = document.createElement("span");
      previewWrap.className = "variant-option-preview";
      previewWrap.appendChild(createVariantPreviewSvg(type, index));

      const label = document.createElement("span");
      label.className = "variant-option-label";
      label.textContent = variant.name;

      option.append(previewWrap, label);
      option.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this.selectVariant(type, index);
      });

      this.listEl.appendChild(option);
    });

    this.dropdown.classList.remove("hidden");
    this.positionDropdown(anchorBtn);
  }

  positionDropdown(anchorBtn) {
    const rect = anchorBtn.getBoundingClientRect();
    const gap = 6;
    this.dropdown.style.left = `${rect.left}px`;
    this.dropdown.style.top = `${rect.bottom + gap}px`;
    this.dropdown.style.minWidth = `${Math.max(rect.width, 160)}px`;
  }

  close() {
    this.openType = null;
    this.dropdown.classList.add("hidden");
  }

  selectVariant(type, variantIndex) {
    this.state.setActiveVariant(type, variantIndex);
    this.state.setActiveType(type);
    this.updateAllButtonThumbs();
    this.close();
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
  }

  syncActiveButtons() {
    this.pieceButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.type === this.state.activeType);
    });
  }
}

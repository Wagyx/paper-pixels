import { PIECE_TYPES } from "../config.js";
import { getVariantConnectors } from "./connectors.js";

function splitSides(connectors, w, h) {
  return {
    top: connectors.slice(0, w),
    right: connectors.slice(w, w + h),
    bottom: connectors.slice(w + h, w + h + w),
    left: connectors.slice(w + h + w, w + h + w + h),
  };
}

function joinSides({ top, right, bottom, left }) {
  return [...top, ...right, ...bottom, ...left];
}

/** 180° rotation for a w×h piece (same footprint). */
export function rotateConnectors180(connectors, w, h) {
  const { top, right, bottom, left } = splitSides(connectors, w, h);
  return joinSides({
    top: bottom.slice().reverse(),
    right: left.slice().reverse(),
    bottom: top.slice().reverse(),
    left: right.slice().reverse(),
  });
}

/** 90° clockwise rotation for a square n×n piece. */
export function rotateConnectors90CW(connectors, n) {
  const { top, right, bottom, left } = splitSides(connectors, n, n);
  return joinSides({
    top: left.slice(),
    right: top.slice(),
    bottom: right.slice(),
    left: bottom.slice(),
  });
}

/** All connector arrays equivalent to this one under piece-type symmetries. */
export function symmetricConnectorKeys(type, connectors) {
  const { w, h } = PIECE_TYPES[type];
  const keys = new Set();
  const add = (arr) => keys.add(arr.join(","));

  add(connectors);

  if (w === h) {
    let current = connectors;
    for (let i = 0; i < 3; i++) {
      current = rotateConnectors90CW(current, w);
      add(current);
    }
  } else {
    add(rotateConnectors180(connectors, w, h));
  }

  return keys;
}

export function areConnectorsRotationEquivalent(type, connectorsA, connectorsB) {
  const keysB = symmetricConnectorKeys(type, connectorsB);
  for (const key of symmetricConnectorKeys(type, connectorsA)) {
    if (keysB.has(key)) return true;
  }
  return false;
}

export function canonicalConnectorKey(type, connectors) {
  return [...symmetricConnectorKeys(type, connectors)].sort()[0];
}

export function canonicalConnectorKeyForVariant(type, variantIndex) {
  return canonicalConnectorKey(type, getVariantConnectors(type, variantIndex));
}

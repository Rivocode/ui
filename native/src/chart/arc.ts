function pointAt(radius: number, degrees: number) {
  "worklet";
  const radians = ((degrees - 90) * Math.PI) / 180;
  const x = radius * Math.cos(radians);
  const y = radius * Math.sin(radians);
  return `${x.toFixed(3)} ${y.toFixed(3)}`;
}

export function arcPath(radius: number, from: number, to: number) {
  "worklet";
  const long = Math.abs(to - from) > 180 ? 1 : 0;

  const r = radius.toFixed(3);

  return `M ${pointAt(radius, from)} A ${r} ${r} 0 ${long} 1 ${pointAt(radius, to)}`;
}

export function ringPath(radius: number, from: number, to: number) {
  "worklet";
  const middle = (from + to) / 2;
  const r = radius.toFixed(3);
  const turn = `A ${r} ${r} 0 0 1`;

  return `M ${pointAt(radius, from)} ${turn} ${pointAt(radius, middle)} ${turn} ${pointAt(radius, to)}`;
}

export function radialLine(inner: number, outer: number, degrees: number) {
  "worklet";
  return `M ${pointAt(inner, degrees)} L ${pointAt(outer, degrees)}`;
}

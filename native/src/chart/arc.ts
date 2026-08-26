function pointAt(radius: number, degrees: number) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  const x = radius * Math.cos(radians);
  const y = radius * Math.sin(radians);
  return `${x.toFixed(3)} ${y.toFixed(3)}`;
}

export function arcPath(radius: number, from: number, to: number) {
  const long = Math.abs(to - from) > 180 ? 1 : 0;

  const r = radius.toFixed(3);

  return `M ${pointAt(radius, from)} A ${r} ${r} 0 ${long} 1 ${pointAt(radius, to)}`;
}

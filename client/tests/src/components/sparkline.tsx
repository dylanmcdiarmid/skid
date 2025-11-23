import { memo, useMemo } from "react";

type Point = { x: number; y: number };

export const Sparkline = ({
  values,
  width = 120,
  height = 32,
  stroke = "currentColor",
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) => {
  const path = useMemo(() => {
    if (!values?.length) {
      return "";
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const denom = max - min || 1;
    const pts: Point[] = values.map((v, i) => ({
      x: (i / (values.length - 1)) * width,
      y: height - ((v - min) / denom) * height,
    }));
    return pts
      .map(
        (p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`
      )
      .join(" ");
  }, [values, width, height]);

  return (
    <svg
      aria-hidden="true"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    >
      <title>Sparkline</title>
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} />
    </svg>
  );
};

export default memo(Sparkline);

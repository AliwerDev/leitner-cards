"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS_TICK, CHART, ChartCard, ChartEmpty, ChartTooltip } from "./chart-parts";
import { formatAccuracy, formatDayShort } from "@/lib/domain/format";
import { uz } from "@/lib/i18n/uz";
import type { DailyPoint } from "@/types/api";

const HEIGHT = 160;

/**
 * Accuracy per day, on its own 0..100% scale.
 *
 * `accuracy` is null on a day with nothing answered, and the line is meant to
 * break there rather than dive to zero - a quiet day is missing data, not a day
 * of wrong answers. Recharts breaks a line on null when connectNulls is off.
 */
export function AccuracyTrend({ days }: { days: DailyPoint[] }) {
  const scored = days.filter((point) => point.accuracy !== null);

  if (scored.length === 0) {
    return (
      <ChartCard title={uz.stats.accuracyTrend} subtitle={uz.stats.lastNDays(days.length)}>
        <ChartEmpty message={uz.stats.noReviewsYet} height={HEIGHT} />
      </ChartCard>
    );
  }

  const points = days.map((point) => ({
    ...point,
    // Recharts plots the raw number, so percent conversion happens here and the
    // axis just formats.
    percent: point.accuracy === null ? null : Math.round(point.accuracy * 100),
  }));

  return (
    <ChartCard title={uz.stats.accuracyTrend} subtitle={uz.stats.lastNDays(days.length)}>
      <div className="text-success" style={{ height: HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid
              vertical={false}
              stroke="currentColor"
              strokeWidth={CHART.gridWidth}
              className="text-border"
            />

            <XAxis
              dataKey="day"
              tickFormatter={formatDayShort}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
              className="text-fg-subtle"
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 50, 100]}
              tickFormatter={(value: number) => `${value}%`}
              width={44}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              className="text-fg-subtle"
            />

            <Tooltip
              cursor={{ stroke: "currentColor", strokeWidth: CHART.gridWidth }}
              content={({ active, payload }) => {
                const entry = payload?.[0];
                if (!active || !entry) return null;
                const point = entry.payload as DailyPoint;
                return (
                  <ChartTooltip
                    label={formatDayShort(point.day)}
                    rows={[
                      {
                        key: "accuracy",
                        label: uz.stats.accuracyLabel,
                        value: formatAccuracy(point.accuracy),
                      },
                      {
                        key: "reviews",
                        label: uz.stats.reviewsLabel,
                        value: String(point.reviews),
                      },
                    ]}
                  />
                );
              }}
            />

            <Line
              type="monotone"
              dataKey="percent"
              stroke="currentColor"
              strokeWidth={CHART.lineWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              activeDot={{ r: CHART.dotRadius, strokeWidth: 2, className: "text-surface" }}
              // A quiet day leaves a gap on purpose - see the note above.
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

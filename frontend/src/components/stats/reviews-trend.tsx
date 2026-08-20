"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS_TICK, CHART, ChartCard, ChartEmpty, ChartTooltip } from "./chart-parts";
import { formatDayShort } from "@/lib/domain/format";
import { uz } from "@/lib/i18n/uz";
import type { DailyPoint } from "@/types/api";

const HEIGHT = 200;

/**
 * Reviews per day. One series, so it is an area rather than a line, and it needs
 * no legend - the title says what is plotted.
 *
 * Accuracy is deliberately NOT drawn here. It is a 0..1 ratio against a count,
 * and a second y-axis is the one thing a reader reliably misreads, so it gets
 * its own chart.
 */
export function ReviewsTrend({ days }: { days: DailyPoint[] }) {
  const total = days.reduce((sum, point) => sum + point.reviews, 0);

  if (total === 0) {
    return (
      <ChartCard title={uz.stats.reviewsTrend} subtitle={uz.stats.lastNDays(days.length)}>
        <ChartEmpty message={uz.stats.noReviewsYet} height={HEIGHT} />
      </ChartCard>
    );
  }

  return (
    <ChartCard title={uz.stats.reviewsTrend} subtitle={uz.stats.lastNDays(days.length)}>
      {/* text-accent sets currentColor for the marks; text-fg-subtle would win
          for the axes, so each axis names its own class instead. */}
      <div className="text-accent" style={{ height: HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={days} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="reviews-wash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity={CHART.areaOpacity * 2} />
                <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>

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
              allowDecimals={false}
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
                        key: "reviews",
                        label: uz.stats.reviewsLabel,
                        value: String(point.reviews),
                      },
                      {
                        key: "correct",
                        label: uz.stats.correctLabel,
                        value: String(point.correct),
                      },
                    ]}
                  />
                );
              }}
            />

            <Area
              type="monotone"
              dataKey="reviews"
              stroke="currentColor"
              strokeWidth={CHART.lineWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="url(#reviews-wash)"
              // A dot per day is noise at 30 points; the tooltip carries values.
              dot={false}
              activeDot={{ r: CHART.dotRadius, strokeWidth: 2, className: "text-surface" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

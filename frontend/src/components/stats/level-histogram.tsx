"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CardLevel } from "@/types/api";
import { AXIS_TICK, CHART, ChartCard, ChartTooltip } from "./chart-parts";
import { uz } from "@/lib/i18n/uz";
import type { LevelBucket } from "@/types/api";

const HEIGHT = 200;

/**
 * Levels are ordinal, not categorical, so the bars use one accent with a
 * lightness ramp rather than the deck palette. Mastered stands apart.
 */
export function LevelHistogram({ buckets }: { buckets: LevelBucket[] }) {
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);

  return (
    <ChartCard title={uz.stats.byLevel} subtitle={uz.stats.cardsInLevel(total)}>
      {/* currentColor for the bars; the axes name their own token class. */}
      <div className="text-accent" style={{ height: HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="level"
              tickFormatter={(level: number) =>
                level === CardLevel.Mastered ? "★" : String(level)
              }
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
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
              // Recharts tints the hovered band by default, which reads as a
              // selected bar; the tooltip alone is enough.
              cursor={{ className: "fill-surface-hover" }}
              content={({ active, payload }) => {
                const entry = payload?.[0];
                if (!active || !entry) return null;
                const bucket = entry.payload as LevelBucket;
                return (
                  <ChartTooltip
                    label={bucket.label}
                    rows={[
                      {
                        key: "count",
                        label: uz.stats.totalCards,
                        value: String(bucket.count),
                      },
                    ]}
                  />
                );
              }}
            />

            <Bar dataKey="count" maxBarSize={CHART.barMaxWidth} radius={CHART.barRadius}>
              {/* All eight buckets always render, zeros included - a gap would
                  read as missing data rather than an empty level. The ramp
                  encodes the ordinal position; mastered gets its own role. */}
              {buckets.map((bucket) => {
                const mastered = bucket.level === CardLevel.Mastered;
                return (
                  <Cell
                    key={bucket.level}
                    fill="currentColor"
                    className={mastered ? "text-mastered" : undefined}
                    fillOpacity={mastered ? 1 : 0.35 + (bucket.level / 8) * 0.65}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

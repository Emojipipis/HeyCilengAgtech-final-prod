import { useState, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { Tabs } from '@/components/ui/Tabs'
import { cn } from '@/lib/cn'

/**
 * Chart conventions (see the dataviz method):
 * - colours come from validated tokens (--c-chart-1/2), never series-coloured text;
 * - thin bars with 4px rounded data ends, 2px gaps, recessive grid;
 * - every chart has a hover tooltip, visible value labels and a table view.
 */

export interface Series<T> {
  key: keyof T & string
  label: string
  /** 1 or 2 — maps to the validated chart tokens. */
  slot: 1 | 2
}

const SLOT_COLOR = { 1: 'var(--c-chart-1)', 2: 'var(--c-chart-2)' }
const AXIS_TICK = { fill: 'var(--c-text-subtle)', fontSize: 12 }

function ChartTooltip({ active, payload, label, format }: TooltipContentProps<number, string> & { format: (v: number) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-raised">
      <p className="font-semibold text-fg">{label}</p>
      <ul className="mt-1 space-y-0.5">
        {payload.map((p) => (
          <li key={String(p.dataKey)} className="flex items-center gap-2 text-muted">
            <span className="size-2 rounded-sm" style={{ background: p.color }} aria-hidden="true" />
            {p.name}: <span className="font-semibold text-fg tabular-nums">{format(Number(p.value))}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface ChartFrameProps<T> {
  title: string
  description?: string
  data: T[]
  /** First column of the table view. */
  labelKey: keyof T & string
  labelHeader: string
  series: Series<T>[]
  format?: (value: number) => string
  demo?: boolean
  empty?: ReactNode
  children: ReactNode
  className?: string
}

/** Card with a Chart / Table toggle. The table view is the accessible equivalent of the chart. */
export function ChartFrame<T>({ title, description, data, labelKey, labelHeader, series, format = String, demo, empty, children, className }: ChartFrameProps<T>) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  return (
    <Card className={className}>
      <CardHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {title}
            {demo && <DemoBadge />}
          </span>
        }
        description={description}
        action={
          <Tabs
            label={`${title} view`}
            variant="pill"
            value={view}
            onChange={setView}
            items={[
              { value: 'chart', label: 'Chart' },
              { value: 'table', label: 'Table' },
            ]}
          />
        }
      />
      <CardBody>
        {data.length === 0 ? (
          (empty ?? <p className="py-10 text-center text-sm text-muted">No data yet.</p>)
        ) : view === 'chart' ? (
          <>
            {series.length > 1 && (
              <ul className="mb-3 flex flex-wrap gap-4 text-xs text-muted" aria-label="Legend">
                {series.map((s) => (
                  <li key={s.key} className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm" style={{ background: SLOT_COLOR[s.slot] }} aria-hidden="true" />
                    {s.label}
                  </li>
                ))}
              </ul>
            )}
            {children}
          </>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">{title}</caption>
              <thead>
                <tr className="border-b border-border text-left text-xs text-subtle uppercase">
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    {labelHeader}
                  </th>
                  {series.map((s) => (
                    <th key={s.key} scope="col" className="py-2 pr-4 text-right font-semibold">
                      {s.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <th scope="row" className="py-2 pr-4 text-left font-medium text-fg">
                      {String(row[labelKey])}
                    </th>
                    {series.map((s) => (
                      <td key={s.key} className="py-2 pr-4 text-right text-muted tabular-nums">
                        {format(Number(row[s.key]))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

interface BarsProps<T> {
  data: T[]
  labelKey: keyof T & string
  series: Series<T>[]
  format?: (value: number) => string
  /** Horizontal bars suit long category names. */
  layout?: 'vertical' | 'horizontal'
  height?: number
  className?: string
}

/** Bar chart for one or two series on a single axis. */
export function Bars<T>({ data, labelKey, series, format = String, layout = 'vertical', height = 260, className }: BarsProps<T>) {
  const horizontal = layout === 'horizontal'
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data as Record<string, unknown>[]}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 18, right: horizontal ? 40 : 8, left: horizontal ? 8 : -12, bottom: 0 }}
          barGap={2}
          barCategoryGap="28%"
        >
          <CartesianGrid stroke="var(--c-border)" strokeDasharray="3 3" vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={format} />
              <YAxis type="category" dataKey={String(labelKey)} tick={AXIS_TICK} axisLine={false} tickLine={false} width={130} />
            </>
          ) : (
            <>
              <XAxis dataKey={String(labelKey)} tick={AXIS_TICK} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={format} width={56} />
            </>
          )}
          <Tooltip cursor={{ fill: 'var(--c-surface-sunken)' }} content={(props) => <ChartTooltip {...(props as TooltipContentProps<number, string>)} format={format} />} />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={String(s.key)}
              name={s.label}
              fill={SLOT_COLOR[s.slot]}
              radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              maxBarSize={horizontal ? 18 : 28}
              stroke="var(--c-surface)"
              strokeWidth={1}
            >
              <LabelList dataKey={String(s.key)} position={horizontal ? 'right' : 'top'} formatter={(v) => format(Number(v))} style={{ fill: 'var(--c-text-muted)', fontSize: 11 }} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ------------------------------------------------------------------ Donut (part-to-whole) */

export interface Slice {
  key: string
  label: string
  value: number
  /** A validated token: var(--c-chart-1..3), var(--c-chart-other) or a var(--c-status-*) for states. */
  color: string
  /** Status slices carry an icon so colour never carries meaning alone. */
  icon?: ReactNode
}

function SliceTooltip({ active, payload, total, format }: TooltipContentProps<number, string> & { total: number; format: (v: number) => string }) {
  if (!active || !payload?.length) return null
  const s = payload[0].payload as Slice
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-raised">
      <p className="flex items-center gap-2 font-semibold text-fg">
        <span className="size-2 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
        {s.label}
      </p>
      <p className="mt-0.5 text-muted tabular-nums">
        {format(s.value)} · {total ? Math.round((s.value / total) * 100) : 0}%
      </p>
    </div>
  )
}

/** Whole-number percentages that always add up to 100 (largest-remainder rounding). */
function wholePercents(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0)
  if (!total) return values.map(() => 0)
  const raw = values.map((v) => (v / total) * 100)
  const floors = raw.map(Math.floor)
  let left = 100 - floors.reduce((a, b) => a + b, 0)
  raw
    .map((r, i) => ({ i, rest: r - floors[i] }))
    .sort((a, b) => b.rest - a.rest)
    .forEach(({ i }) => {
      if (left > 0) {
        floors[i] += 1
        left -= 1
      }
    })
  return floors
}

interface DonutProps {
  title: string
  description?: string
  slices: Slice[]
  format?: (value: number) => string
  /** Shown in the hole, e.g. the total. */
  centerValue: string
  centerLabel: string
  valueHeader: string
  empty?: ReactNode
  className?: string
}

/**
 * Donut for a few parts of one whole (max 3 named slices + "Other"). Every slice is direct-labelled in the
 * legend with its value and share, slices are separated by 2px surface gaps, and a table view is provided.
 */
export function Donut({ title, description, slices, format = String, centerValue, centerLabel, valueHeader, empty, className }: DonutProps) {
  const visible = slices.filter((s) => s.value > 0)
  const total = visible.reduce((sum, s) => sum + s.value, 0)
  const shares = wholePercents(visible.map((s) => s.value))
  return (
    <ChartFrame
      title={title}
      description={description}
      data={visible}
      labelKey="label"
      labelHeader="Category"
      series={[{ key: 'value', label: valueHeader, slot: 1 }]}
      format={format}
      empty={empty}
      className={className}
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <div className="relative size-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={visible}
                dataKey="value"
                nameKey="label"
                innerRadius="64%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                stroke="var(--c-surface)"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {visible.map((s) => (
                  <Cell key={s.key} fill={s.color} />
                ))}
              </Pie>
              <Tooltip content={(props) => <SliceTooltip {...(props as TooltipContentProps<number, string>)} total={total} format={format} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-display text-lg font-bold text-fg tabular-nums">{centerValue}</span>
            <span className="text-xs text-subtle">{centerLabel}</span>
          </div>
        </div>
        <ul className="w-full min-w-0 space-y-2 text-sm" aria-label={`${title} breakdown`}>
          {visible.map((s) => (
            <li key={s.key} className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
              {s.icon && <span className="shrink-0 text-subtle [&_svg]:size-3.5" aria-hidden="true">{s.icon}</span>}
              <span className="min-w-0 flex-1 truncate text-muted">{s.label}</span>
              <span className="font-semibold text-fg tabular-nums">{format(s.value)}</span>
              <span className="w-10 text-right text-xs text-subtle tabular-nums">{shares[visible.indexOf(s)]}%</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartFrame>
  )
}

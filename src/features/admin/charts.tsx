import { useState, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
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

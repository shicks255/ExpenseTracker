import { useEffect, useState } from 'react';
import { useReports } from '@/hooks/useReports';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { LineChart, Line, XAxis, YAxis, Legend } from 'recharts';
import { generateDateRange } from '@/lib/utils';
import { DatePicker } from './DatePicker';
import { Radio, RadioGroup } from './ui/radio';
import { useCategories } from '@/hooks/useCategories';
import { Field, FieldGroup, FieldLabel } from './ui/field';
import { Checkbox } from './ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
// import { RechartsDevtools } from '@recharts/devtools';

const computeAggregation = (dateRange: { from: string; to: string }) => {
  const from = new Date(dateRange.from);
  const to = new Date(dateRange.to);
  const diffInDays = (to.getTime() - from.getTime()) / (1000 * 3600 * 24);

  if (diffInDays <= 7) {
    return 'daily';
  } else if (diffInDays <= 60) {
    return 'weekly';
  } else if (diffInDays <= 365) {
    return 'monthly';
  } else {
    return 'yearly';
  }
};

const computeDateFormat = (aggregation: string) => {
  switch (aggregation) {
    case 'daily':
      return {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      } as const;
    case 'weekly':
      return {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      } as const;
    case 'monthly':
      return {
        month: 'short',
        year: 'numeric',
      } as const;
    case 'yearly':
      return {
        year: 'numeric',
      } as const;
    default:
      return {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      } as const;
  }
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value / 100);

const colors = [
  '#3b82f6',
  '#ef4444',
  '#22c55e',
  '#f59e0b',
  '#a855f7',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
];

const LineTooltipWrapper = ({ payload, ...props }) => {
  const filtered = [...(payload ?? [])]
    .filter((item) => {
      const value = Number(item.value);

      return Number.isFinite(value) && value !== 0;
    })
    .sort((a, b) => Number(b.value) - Number(a.value))
    .map((a) => {
      return { ...a, value: formatCurrency(a.value) };
    });

  if (filtered.length == 0) {
    return null;
  }

  return <ChartTooltipContent {...props} payload={filtered} />;
};

export const Charts = () => {
  const [dateRange, setDateRange] = useState(() => generateDateRange('30d'));
  const aggregation = computeAggregation(dateRange);
  const [cumulative, setCumulative] = useState(false);
  const [selectedCats, setSelectedCats] = useState<number[]>([]);

  const { data: categories, isLoading: isCategoriesLoading } = useCategories();

  useEffect(() => {
    if (categories) {
      setSelectedCats(categories.map((cat) => cat.id));
    }
  }, [categories]);

  const { isLoading, error, data } = useReports({
    aggregation,
    groupBy: 'category',
    from: dateRange.from,
    to: dateRange.to,
  });

  // @ts-expect-error - need to fix this in the controller
  let chartData = data?.rows?.map((row) => {
    const date = row.bucket;
    return { date, ...row.values };
  });

  console.log(chartData);

  if (cumulative) {
    let rummingSum = 0;
    chartData = chartData?.map((row) => {
      rummingSum += row.value;
      return {
        ...row,
        value: rummingSum,
      };
    });
  }

  const dateFormat = computeDateFormat(aggregation);

  return (
    <div>
      <Field>
        <FieldLabel>Date range</FieldLabel>
      </Field>
      <DatePicker
        currentValue={dateRange}
        onDateChange={(from, to) => {
          setDateRange({ from, to });
        }}
      />

      <Field>
        <FieldLabel>Behavior</FieldLabel>
      </Field>
      <RadioGroup defaultValue="Split" aria-label="X">
        <Radio value="Split" onClick={() => setCumulative(false)}>
          Split
        </Radio>
        <Radio value="Cumulative" onClick={() => setCumulative(true)}>
          Cumulative
        </Radio>
      </RadioGroup>

      <div>
        <div>Categories to include here:</div>
        <div>
          {categories?.map((cat) => (
            <FieldGroup key={cat.id} className="max-w-sm">
              <Field orientation="horizontal">
                <Checkbox
                  checked={selectedCats.includes(cat.id)}
                  id={`cat${cat.id}`}
                  name={`cat${cat.id}`}
                  onCheckedChange={() =>
                    setSelectedCats((cur) => {
                      if (cur.includes(cat.id)) {
                        return cur.filter((id) => id !== cat.id);
                      } else {
                        return [...cur, cat.id];
                      }
                    })
                  }
                />
                <Label htmlFor={`cat${cat.id}`}>{cat.name}</Label>
              </Field>
            </FieldGroup>
          ))}
        </div>
      </div>
      {isLoading && (
        <div className=" h-100 inset-0 z-50 flex items-center justify-center pointer-events-none">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      <ChartContainer
        config={{
          value: {
            label: 'Spending',
            color: 'hsl(var(--chart-1))',
          },
        }}
      >
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 0,
            left: 0,
            bottom: 5,
          }}
        >
          {/* <CartesianGrid strokeDasharray="3 3" /> */}
          <XAxis
            dataKey="date"
            stroke="#8884d8"
            tickFormatter={(value) => new Date(value).toLocaleDateString('default', dateFormat)}
          />
          <YAxis stroke="#8884d8" tickFormatter={(value: number) => formatCurrency(value)} />
          <ChartTooltip
            content={<LineTooltipWrapper />}
            // itemSorter={(item) => -(Number(item.value) || 0)}
            // formatter={(value: number, name: string) => name + formatCurrency(value)}
            labelFormatter={(value) => new Date(value).toLocaleDateString('default', dateFormat)}
          />
          <Legend />
          {selectedCats.map((c, i) => {
            const name = categories?.find((cc) => cc.id == c)?.name ?? '';
            return (
              <Line
                stroke={colors[i % colors.length]}
                name={name}
                key={c}
                type="monotone"
                dataKey={c}
              />
            );
          })}
        </LineChart>
      </ChartContainer>
    </div>
  );
};

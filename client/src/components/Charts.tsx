import { useEffect, useState } from 'react';
import { useReports } from '@/hooks/useReports';
import { ChartContainer } from './ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { generateDateRange } from '@/lib/utils';
import { DatePicker } from './DatePicker';
import { Radio, RadioGroup } from './ui/radio';
import { useCategories } from '@/hooks/useCategories';
import { Field, FieldGroup } from './ui/field';
import { Checkbox } from './ui/checkbox';
import { Label } from '@/components/ui/label';
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
    maximumFractionDigits: 0,
  }).format(value / 100);

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
  let chartData = data?.rows?.map((row) => ({
    date: row.periodStart,
    value: row.totalAmount,
  }));

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
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Charts</h1>
      <p className="text-muted-foreground">Chart support is coming soon.</p>

      <DatePicker
        currentValue={dateRange}
        onDateChange={(from, to) => {
          setDateRange({ from, to });
        }}
      />

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
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(value) => new Date(value).toLocaleDateString('default', dateFormat)}
          />
          <Legend />
          <Line type="monotone" dataKey="value" />
        </LineChart>
      </ChartContainer>
    </div>
  );
};

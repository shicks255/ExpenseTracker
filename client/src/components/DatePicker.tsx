import { useEffect, useMemo, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';

import { generateDateRange } from '@/lib/utils';
import { useOnClickOutside } from '@/hooks/use-on-click-outside';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';

type DateFilterOption = '7d' | '30d' | 'pastFullMonth' | '3m' | 'ytd' | 'ly' | 'custom' | 'all';

interface DatePickerValue {
  from: string;
  to: string;
}

interface DatePickerProps {
  onDateChange?: (from: string, to: string) => void;
  currentValue?: DatePickerValue | null;
}

const PRESET_OPTIONS: Array<{ value: Exclude<DateFilterOption, 'custom'>; label: string }> = [
  { value: '7d', label: 'Past 7 days' },
  { value: '30d', label: 'Past month' },
  { value: 'pastFullMonth', label: 'Last full month' },
  { value: '3m', label: 'Last 3 months' },
  { value: 'ytd', label: 'Year to Date' },
  { value: 'ly', label: 'Last year' },
  { value: 'all', label: 'All time' },
];

const toDate = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const toDateOnly = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toRangeValue = (range?: DateRange): DatePickerValue | null => {
  if (!range?.from || !range?.to) {
    return null;
  }

  return {
    from: toDateOnly(range.from),
    to: toDateOnly(range.to),
  };
};

const formatRangeLabel = (value: DatePickerValue | null) => {
  if (!value) {
    return 'Custom';
  }

  const from = toDate(value.from);
  const to = toDate(value.to);

  if (!from || !to) {
    return 'Custom';
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `Custom (${formatter.format(from)} - ${formatter.format(to)})`;
};

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export const DatePicker = ({ onDateChange, currentValue = null }: DatePickerProps) => {
  const initialRange = useMemo<DateRange | undefined>(() => {
    if (!currentValue) {
      return undefined;
    }

    return {
      from: toDate(currentValue.from),
      to: toDate(currentValue.to),
    };
  }, [currentValue]);

  const [selectedOption, setSelectedOption] = useState<DateFilterOption>('30d');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(initialRange);
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCustomRange(initialRange);
  }, [currentValue, initialRange]);

  useOnClickOutside(containerRef, () => {
    setIsOpen(false);
    setShowCalendar(false);
  });

  const triggerLabel =
    selectedOption === 'custom'
      ? formatRangeLabel(currentValue)
      : (PRESET_OPTIONS.find((option) => option.value === selectedOption)?.label ??
        'Select date range');

  const applyPreset = (value: Exclude<DateFilterOption, 'custom'>) => {
    setSelectedOption(value);
    setCustomRange(undefined);
    setShowCalendar(false);
    setIsOpen(false);

    const range = generateDateRange(value);
    onDateChange?.(range.from, range.to);
  };

  const openCustomCalendar = () => {
    setSelectedOption('custom');
    setCustomRange(undefined);
    setShowCalendar(true);
    setIsOpen(true);
  };

  const onSelectCustomRange = (range: DateRange | undefined) => {
    if (range?.from && range?.to && isSameDay(range.from, range.to)) {
      setCustomRange({ from: range.from, to: undefined });
      return;
    }

    setCustomRange(range);

    if (!range?.from || !range?.to) {
      return;
    }

    const nextRange = toRangeValue(range);
    if (!nextRange) {
      return;
    }

    setSelectedOption('custom');
    onDateChange?.(nextRange.from, nextRange.to);
    setIsOpen(false);
    setShowCalendar(false);
  };

  return (
    <div ref={containerRef} className="relative inline-flex">
      <Button
        type="button"
        variant="outline"
        className="min-w-[280px] justify-between"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0" />
      </Button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 min-w-[280px] rounded-lg border bg-popover p-2 shadow-md ring-1 ring-foreground/10">
          {!showCalendar ? (
            <div className="flex flex-col gap-1">
              {PRESET_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="ghost"
                  className="justify-start"
                  onClick={() => applyPreset(option.value)}
                >
                  {option.label}
                </Button>
              ))}
              <div className="my-1 h-px bg-border" />
              <Button
                type="button"
                variant="ghost"
                className="justify-start"
                onClick={openCustomCalendar}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedOption === 'custom' ? formatRangeLabel(currentValue) : 'Custom'}
              </Button>
            </div>
          ) : (
            <Calendar
              mode="range"
              selected={customRange}
              onSelect={onSelectCustomRange}
              numberOfMonths={2}
            />
          )}
        </div>
      )}
    </div>
  );
};

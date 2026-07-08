import { useState, useEffect } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import {
  Table,
  TableCaption,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from '@/components/ui/table';
import { ArrowDown, ArrowDownUp, ArrowUp, Search, X } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { Field, FieldLabel } from './ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group';
import { DatePicker } from './DatePicker';
import { generateDateRange } from '@/lib/utils';

const TableSortIcons = (sortBy: string, sortDirection: string, item: string) => {
  return (
    <>
      {sortBy === item && sortDirection === 'asc' && <ArrowUp />}
      {sortBy === item && sortDirection === 'desc' && <ArrowDown />}
      {sortBy !== item && <ArrowDownUp />}
    </>
  );
};

export default function ExpenseTable() {
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'vendor' | 'category_id'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [categoryFilters, setCategoryFilters] = useState<number[]>([]);
  const [dateRange, setDateRange] = useState(() => generateDateRange('30d'));

  const [vendorFilter, setVendorFilter] = useState<string>('');
  const [vendorParam, setVendorParam] = useState<string>('');

  const expenses = useExpenses({
    sortBy,
    sortDirection,
    categoryIds: categoryFilters,
    vendor: vendorParam,
    dateRange,
  });

  const categories = useCategories();

  useEffect(() => {
    if (categories.data && categoryFilters.length == 0) {
      setCategoryFilters(categories.data.map((cat) => cat.id));
    }
  }, [categories.data]);

  if (!expenses.data) return <p>No expenses yet.</p>;
  if (!categories.data) return <p>No categories yet.</p>;

  const sortColumn = (item: string) => {
    if (sortBy === item) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(item as 'date' | 'amount' | 'vendor' | 'category_id');
      setSortDirection('asc');
    }
  };

  const clearFilter = () => {
    setVendorFilter('');
    setVendorParam(undefined);
  };

  return (
    <>
      <div className="relative inline-block">
        Filters
        <DatePicker
          currentValue={dateRange}
          onDateChange={(from, to) => {
            setDateRange({ from, to });
          }}
        />
        <Field>
          <FieldLabel className="text-sm">Category</FieldLabel>
          <InputGroup className="max-w-xs">
            <InputGroupInput placeholder="Search..." />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel className="text-sm">Vendor</FieldLabel>
          <InputGroup className="max-w-xs" onBlur={() => setVendorParam(vendorFilter)}>
            <InputGroupInput
              onChange={(e) => setVendorFilter(e.target.value)}
              value={vendorFilter}
              placeholder="Search..."
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupAddon onClick={clearFilter} className="cursor-pointer" align="inline-end">
              <X />
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </div>
      <Table>
        <TableCaption>No more expenses to display.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">
              <span
                className="inline-flex items-center gap-2 hover:text-blue-500 hover:cursor-pointer"
                onClick={() => sortColumn('date')}
              >
                Date
                {TableSortIcons(sortBy, sortDirection, 'date')}
              </span>
            </TableHead>
            <TableHead>
              <span
                className="inline-flex items-center gap-2 hover:text-blue-500 hover:cursor-pointer"
                onClick={() => sortColumn('vendor')}
              >
                Vendor
                {TableSortIcons(sortBy, sortDirection, 'vendor')}
              </span>
            </TableHead>
            <TableHead>
              {/* <span
                                className="inline-flex items-center gap-2 hover:text-blue-500 hover:cursor-pointer"
                                onClick={() => sortColumn('category_id')}
                            > */}
              Category
              {/* {TableSortIcons(sortBy, sortDirection, 'category_id')} */}
              {/* </span> */}
            </TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="text-right">
              <span
                className="inline-flex items-center gap-2 hover:text-blue-500 hover:cursor-pointer"
                onClick={() => sortColumn('amount')}
              >
                Amount
                {TableSortIcons(sortBy, sortDirection, 'amount')}
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.data.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="font-medium">
                {new Date(expense.date).toLocaleDateString()}
              </TableCell>
              <TableCell>{expense.vendor}</TableCell>
              <TableCell>
                {expense.category_id &&
                  categories.data.find((cat) => cat.id === expense.category_id)?.name}
              </TableCell>
              <TableCell>{expense.note}</TableCell>
              <TableCell className="text-right">
                ${Number(expense.amount / 100).toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>Total</TableCell>
            <TableCell className="text-right">
              $
              {expenses.data
                .reduce((sum, expense) => sum + Number(expense.amount) / 100, 0)
                .toFixed(2)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </>
  );
}

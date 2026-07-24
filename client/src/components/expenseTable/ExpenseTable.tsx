import { useState, useEffect, useRef } from 'react';
import {
  useExpenses,
  useExpenseVendors,
  useInifiniteExpenses,
  useUpdateExpense,
} from '@/hooks/useExpenses';
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
import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  CalendarIcon,
  Check,
  Loader2,
  MoreHorizontalIcon,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { Field, FieldLabel } from '../ui/field';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../ui/input-group';
import { DatePicker } from '../DatePicker';
import { generateDateRange } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '../ui/combobox';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { RadioGroup } from '../ui/radio';
import { RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Item, ItemContent, ItemMedia, ItemTitle } from '../ui/item';
import { Spinner } from '../ui/spinner';

const unwrapMoney = (amount: number) => {
  return amount / 100;
};

const wrapMoney = (amount: string) => {
  if (amount.endsWith('.')) {
    return Math.round(Number(`${amount}00`) * 100);
  }
  return Math.round(Number(amount) * 100);
};

const TableSortIcons = (sortBy: string, sortDirection: string, item: string) => {
  return (
    <>
      {sortBy === item && sortDirection === 'asc' && <ArrowUp />}
      {sortBy === item && sortDirection === 'desc' && <ArrowDown />}
      {sortBy !== item && <ArrowDownUp />}
    </>
  );
};

const formatDate = (date: Date | undefined) => {
  if (!date) {
    return undefined;
  }
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatDateForPublish = (date: Date | undefined) => {
  if (!date) {
    return undefined;
  }

  return date.toISOString().split('T')[0];
};

export default function ExpenseTable() {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'vendor' | 'category_id'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [dateRange, setDateRange] = useState(generateDateRange('30d'));
  const [categoryFilters, setCategoryFilters] = useState<number[]>([]);
  const [vendorFilter, setVendorFilter] = useState<string>('');

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [month, setMonth] = useState<Date | undefined>(undefined);

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [comboBoxVendorValue, setComboBoxVendorValue] = useState<string | undefined>(undefined);
  const [comboBoxCategoryValue, setComboBoxCategoryValue] = useState<string | undefined>(undefined);
  const [note, setNote] = useState<string | undefined>(undefined);
  const [amount, setAmount] = useState<string | undefined>(undefined);

  const [editingItem, setEditingItem] = useState<string | null>(null);

  const [checkedExpenses, setCheckedExpense] = useState<string[]>([]);
  const [checkedItemsRadio, setCheckedItemsRadio] = useState<string>('VENDOR');
  // const [page, setPage] = useState(1);

  const anchor = useComboboxAnchor();
  const { data, isFetching, fetchNextPage } = useInifiniteExpenses({
    sortBy,
    sortDirection,
    categoryIds: categoryFilters,
    vendor: vendorFilter,
    dateRange,
    pageSize: 149,
    pageNumber: 1,
  });

  const expenses = data?.pages.flatMap((page) => page.expenses);
  const hasMore = data?.pages[data.pages.length - 1].hasMore;

  const updateExpense = useUpdateExpense();

  const categories = useCategories();
  const { data: vendors } = useExpenseVendors();

  useEffect(() => {
    if (editingItem) {
      const expenseItem = expenses?.find((expense) => expense.id === editingItem);
      if (expenseItem) {
        setDate(new Date(expenseItem.date));
        setComboBoxVendorValue(expenseItem.vendor);
        const category = categories.data?.find((cat) => cat.id === expenseItem.category_id);
        setComboBoxCategoryValue(category?.name ?? '');
        setNote(expenseItem.note ?? '');
        setAmount(unwrapMoney(expenseItem.amount).toString());
      }
    }
  }, [editingItem]);

  useEffect(() => {
    const element = loadMoreRef.current;

    if (!element || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isFetching) {
          fetchNextPage();
        }
      },
      {
        rootMargin: '400px',
        threshold: 0,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasMore, isFetching]);

  const filteredComboBoxVendors = vendors
    ?.filter((vendor) => {
      return vendor.toLowerCase().includes(comboBoxVendorValue?.toLowerCase() || '');
    })
    .slice(0, 5);

  const filteredComboBoxCategories = categories.data
    ?.filter((category) => {
      return category.name.toLowerCase().includes(comboBoxCategoryValue?.toLowerCase() || '');
    })
    .slice(0, 5);

  // useEffect(() => {
  //   if (categories.data && categoryFilters.length == 0) {
  //     setCategoryFilters(categories.data.map((cat) => cat.id));
  //   }
  // }, [categories.data, categoryFilters.length]);

  const sortColumn = (item: string) => {
    if (sortBy === item) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(item as 'date' | 'amount' | 'vendor' | 'category_id');
      setSortDirection('asc');
    }
  };

  const saveItem = (expenseId: string) => {
    const newItem = {
      id: expenseId,
      vendor: comboBoxVendorValue,
      category_id: categories.data.find((cat) => cat.name === comboBoxCategoryValue)?.id,
      date: formatDateForPublish(date) ?? '',
      note: note,
      amount: amount ? wrapMoney(amount) : undefined,
    };
    console.log('Saving item:', newItem);
    setEditingItem(null);

    updateExpense.mutate(newItem);
  };

  const clearFilter = () => {
    setVendorFilter('');
    setVendorParam(undefined);
  };

  return (
    <>
      {isFetching && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="rounded-full border bg-background p-4 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      )}
      <div className="relative inline-block">
        <Field>
          <FieldLabel className="text-sm">Date range</FieldLabel>
        </Field>
        <DatePicker
          currentValue={dateRange}
          onDateChange={(from, to) => {
            setDateRange({ from, to });
          }}
        />
        {categories?.data && (
          <Field>
            <FieldLabel className="text-sm">Category</FieldLabel>
            {/* <InputGroup className="max-w-xs"> */}
            <Combobox
              multiple
              autoHighlight
              items={categories.data}
              itemToStringValue={(item) => item.id}
              onValueChange={(items) => {
                setCategoryFilters(items.map((item) => item.id));
              }}
            >
              <ComboboxChips ref={anchor} className="w-full max-w-xs">
                <ComboboxValue>
                  {(categoryFilters.length == categories.data.length ||
                    categoryFilters.length === 0) && (
                    <ComboboxChip showRemove={false} key="all">
                      All
                    </ComboboxChip>
                  )}
                  {categoryFilters.length != categories.data.length &&
                    categoryFilters.map((categoryId) => {
                      const category = categories.data.find((cat) => cat.id === categoryId);
                      if (!category) return null;
                      return <ComboboxChip key={category.id}>{category.name}</ComboboxChip>;
                    })}
                  <ComboboxChipsInput />
                </ComboboxValue>
              </ComboboxChips>
              <ComboboxContent anchor={anchor}>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.id} value={item}>
                      {item.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            {/* </InputGroup> */}
          </Field>
        )}
        {vendors && (
          <Field>
            <FieldLabel className="text-sm">Vendor</FieldLabel>
            <Combobox
              items={vendors}
              onValueChange={(item) => {
                setVendorFilter(item);
              }}
            >
              <ComboboxInput showClear />
              <ComboboxContent>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </Field>
        )}
      </div>
      <div>
        {checkedExpenses && checkedExpenses.length > 0 && (
          <Dialog>
            <DialogTrigger>Open</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit {checkedExpenses.length} checked items</DialogTitle>
                <DialogDescription>
                  <>
                    <RadioGroup value={checkedItemsRadio}>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem
                          value="VENDOR"
                          onClick={() => setCheckedItemsRadio('VENDOR')}
                          id="radio-button-vendor"
                        />
                        <Label htmlFor="radio-button-vendor">Vendor</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem
                          value="CATEGORY"
                          onClick={() => setCheckedItemsRadio('CATEGORY')}
                          id="radio-button-category"
                        />
                        <Label htmlFor="radio-button-category">Category</Label>
                      </div>
                    </RadioGroup>
                  </>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-row justify-end gap-2 border-t px-6 py-4">
                <Button className="flex-auto" size="icon-xs">
                  Save
                </Button>
                <DialogClose className="flex-auto" asChild>
                  <Button size="icon-xs">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <Table>
        <TableCaption>No more expenses to display.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
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
            <TableHead>
              <TableCell></TableCell>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses?.map((expense) => (
            <>
              {editingItem === expense.id && (
                <TableRow key={`${expense.id}-editing`}>
                  <TableCell>
                    <Field>
                      <InputGroup>
                        <InputGroupInput
                          className="w-[150px]"
                          id="expense-date-field"
                          value={formatDate(date) ?? formatDate(new Date(expense.date))}
                          onChange={(e) => setDate(e.target.value)}
                        />
                        <InputGroupAddon align="inline-end">
                          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                            <PopoverTrigger
                              asChild
                              onClick={() => {
                                setDate(date ?? new Date(expense.date));
                                setMonth(date ?? new Date(expense.date));
                              }}
                            >
                              <div>
                                <InputGroupButton
                                  id="expense-date-field-button"
                                  variant="ghost"
                                  size="icon-xs"
                                  aria-label="Select date"
                                >
                                  <CalendarIcon />
                                  <span className="sr-only">Select date</span>
                                </InputGroupButton>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto overflow-hidden p-0"
                              align="start"
                              alignOffset={-8}
                              sideOffset={10}
                            >
                              <Calendar
                                mode="single"
                                selected={date}
                                month={month}
                                onMonthChange={setMonth}
                                onSelect={(date) => {
                                  setDate(date);
                                  setDatePickerOpen(false);
                                }}
                                // selected={date ? new Date(date) : new Date(expense.date)}
                              />
                            </PopoverContent>
                          </Popover>
                        </InputGroupAddon>
                      </InputGroup>
                    </Field>
                  </TableCell>
                  <TableCell>
                    <Combobox
                      items={filteredComboBoxVendors}
                      onValueChange={(s) => {
                        const val = s ?? '';
                        setComboBoxVendorValue(val as string);
                      }}
                    >
                      <ComboboxInput
                        showClear
                        className="w-35"
                        placeholder="Select a vendor"
                        value={comboBoxVendorValue ?? expense.vendor}
                        onChange={(e) => setComboBoxVendorValue(e.target.value)}
                      />
                      <ComboboxContent side="bottom" className="w-35" align="end" alignOffset={-28}>
                        <ComboboxEmpty>No items found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item) => (
                            <ComboboxItem
                              key={item}
                              value={item}
                              onClick={() => {
                                setComboBoxVendorValue(item);
                              }}
                            >
                              {item}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </TableCell>
                  <TableCell>
                    <Combobox
                      items={filteredComboBoxCategories}
                      itemToStringValue={(item) => item.name}
                      onValueChange={(s) => {
                        const val = s?.name ?? '';
                        setComboBoxCategoryValue(val as string);
                      }}
                    >
                      <ComboboxInput
                        showClear
                        className="w-35"
                        placeholder="Select a category"
                        value={
                          comboBoxCategoryValue ??
                          categories.data.find((cat) => cat.id === expense.category_id)?.name
                        }
                        onChange={(e) => setComboBoxCategoryValue(e.target.value)}
                      />
                      <ComboboxContent side="bottom" className="w-35" align="end" alignOffset={-28}>
                        <ComboboxList>
                          {(item) => (
                            <ComboboxItem
                              key={item.id}
                              value={item}
                              onSelect={() => setComboBoxCategoryValue(item.name)}
                            >
                              {item.name}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </TableCell>
                  <TableCell>
                    <Field>
                      <Input
                        id="update-expense-note-field"
                        value={note ?? expense.note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </Field>
                  </TableCell>
                  <TableCell>
                    <Field>
                      <Input
                        id="update-expense-amount-field"
                        value={amount ?? unwrapMoney(expense.amount)}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </Field>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Button variant="outline" size="icon" onClick={() => saveItem(expense.id)}>
                        <Check />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => {
                          setEditingItem(null);
                          setComboBoxVendorValue(undefined);
                          setComboBoxCategoryValue('');
                        }}
                      >
                        <X />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => {}}>
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {editingItem !== expense.id && (
                <TableRow key={expense.id}>
                  <TableCell>
                    <Checkbox
                      checked={checkedExpenses?.includes(expense.id)}
                      id={`checked-expense-${expense.id}`}
                      onCheckedChange={(checked) => {
                        setCheckedExpense((cur) =>
                          checked
                            ? cur.includes(expense.id)
                              ? cur
                              : [...cur, expense.id]
                            : cur.filter((item) => item !== expense.id),
                        );
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {new Date(expense.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{expense.vendor}</TableCell>
                  <TableCell>
                    {expense.category_id &&
                      categories.data?.find((cat) => cat.id === expense.category_id)?.name}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-64 whitespace-normal break-words">{expense.note}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    $
                    {Number(expense.amount / 100).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontalIcon />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingItem(expense.id)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
        <TableFooter>
          {isFetching && hasMore && (
            <TableRow>
              <TableCell className="text-center" colSpan={7}>
                <div className="mx-auto max-w-xs">
                  <Item variant="muted">
                    <ItemMedia>
                      <Spinner />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="line-clamp-1">Loading more expenses...</ItemTitle>
                    </ItemContent>
                  </Item>
                </div>
              </TableCell>
            </TableRow>
          )}
          <TableRow>
            <TableCell colSpan={5}>
              <div className="invisible h-1" ref={loadMoreRef}>
                Total
              </div>
            </TableCell>
            <TableCell className="text-right">
              $
              {expenses
                ?.reduce((sum, expense) => sum + Number(expense.amount) / 100, 0)
                .toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </>
  );
}

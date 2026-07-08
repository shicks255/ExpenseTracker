import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Field, FieldGroup } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useExpenses } from '@/hooks/useExpenses';
import { generateDateRange } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';

export default function Home() {
  const date = generateDateRange('ly');
  const [selectedCats, setSelectedCats] = useState<number[]>([]);

  const { data: categories, isLoading: isCategoriesLoading } = useCategories();

  const { data: expenses, isLoading: isExpensesLoading } = useExpenses({
    sortBy: 'amount',
    sortDirection: 'desc',
    size: 5,
    categoryIds: selectedCats,
    dateRange: {
      from: date.from,
      to: date.to,
    },
  });

  useEffect(() => {
    if (categories) {
      setSelectedCats(categories.map((cat) => cat.id));
    }
  }, [categories]);

  return (
    <div>
      <h1>Welcome to Expense Tracker</h1>
      <p>Manage your expenses easily.</p>

      <br />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Top expenses this month</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
          <CardAction>
            <Popover>
              <PopoverTrigger asChild>
                <div>
                  <Button variant="outline" size="icon">
                    <Settings />
                  </Button>
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 z-[9999] bg-white border border-red-500 shadow-xl"
                side="bottom"
                align="end"
              >
                <div>Widget Settings</div>
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
              </PopoverContent>
            </Popover>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isExpensesLoading && (
            <>
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="p-4 grid grid-cols-1 gap-4">
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </>
          )}
          {expenses?.map((expense) => (
            <Item key={expense.id} variant="outline">
              <ItemContent className="grid grid-cols-2 gap-4">
                <ItemTitle>{expense.vendor}</ItemTitle>
                <ItemDescription className="text-center">
                  $ {(expense.amount / 100).toFixed(2)}
                </ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <hr />
        </CardFooter>
      </Card>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Cash flow</CardTitle>
          <CardDescription>Cash flow</CardDescription>
          <CardAction>
            <Button variant="outline" size="icon">
              <Settings />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <CardFooter className="flex-col gap-2">
            <hr />
          </CardFooter>
        </CardContent>
      </Card>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Category Stuff</CardTitle>
          <CardDescription>Category related information</CardDescription>
          <CardAction>
            <Button variant="outline" size="icon">
              <Settings />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <CardFooter className="flex-col gap-2">
            <hr />
          </CardFooter>
        </CardContent>
      </Card>
    </div>
  );
}

import { useCategories, usePostCategory } from '@/hooks/useCategories';
import { Settings as SettingsButton, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { useExpenseVendors, useUpdateVendor } from '@/hooks/useExpenses';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Field, FieldGroup } from './ui/field';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Skeleton } from './ui/skeleton';

const sortIcon = (sort: 'asc' | 'desc') => {
  return (
    <>
      {sort === 'asc' && <ArrowUp />}
      {sort === 'desc' && <ArrowDown />}
    </>
  );
};

export const Settings = () => {
  return (
    <>
      <div className="p-4">Adjust various settings for your expense categories and vendors</div>

      <Tabs defaultValue="category" className="w-[400]">
        <TabsList variant="line">
          <TabsTrigger value="category">Categories</TabsTrigger>
          <TabsTrigger value="vendor">Vendors</TabsTrigger>
        </TabsList>
        <TabsContent value="category">
          <CategoryTab />
        </TabsContent>
        <TabsContent value="vendor">
          <VendorTab />
        </TabsContent>
      </Tabs>
    </>
  );
};

const TableSkeleton = () => {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="flex gap-4" key={index}>
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
};

const CategoryTab = () => {
  const { data: categories, isLoading: isCategoriesLoading } = useCategories();
  const postCategory = usePostCategory();

  const [catSort, setCatSort] = useState<'asc' | 'desc'>('asc');

  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [addNewCategoryValue, setAddNewCategoryValue] = useState('');

  const sortedCategories = categories?.sort((a, b) => {
    if (catSort === 'asc') {
      return a.name.localeCompare(b.name);
    } else {
      return b.name.localeCompare(a.name);
    }
  });

  const handleCreateNewCategory = async () => {
    await postCategory.mutateAsync(encodeURIComponent(addNewCategoryValue));
    setAddNewCategoryValue('');
    setShowAddCategoryDialog(false);
  };

  if (isCategoriesLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="max-w-2/5">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="max-w-4"></TableHead>
            <TableHead>
              <span
                className="inline-flex items-center gap-2 hover:text-blue-500 hover:cursor-pointer"
                onClick={() => setCatSort(catSort === 'asc' ? 'desc' : 'asc')}
              >
                Category Name
                {sortIcon(catSort)}
              </span>
            </TableHead>
            <TableHead>
              <Dialog
                onOpenChange={(open) => {
                  if (!open) {
                    setAddNewCategoryValue('');
                  }
                }}
              >
                <DialogTrigger>
                  <Button variant="outline" size="sm">
                    Add Category
                    <Plus />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add a new expense category</DialogTitle>
                  </DialogHeader>
                  <DialogDescription>
                    <Field>
                      <Input
                        id="add-category-input-field"
                        value={addNewCategoryValue}
                        placeholder="Add new category"
                        onChange={(e) => setAddNewCategoryValue(e.target.value)}
                      />
                    </Field>
                  </DialogDescription>
                  <DialogFooter className="flex-row justify-end gap-2 border-t px-6 py-4">
                    <Button
                      disabled={addNewCategoryValue.length < 3}
                      onClick={() => handleCreateNewCategory()}
                      className="flex-auto"
                      size="icon-xs"
                    >
                      Save
                    </Button>
                    <DialogClose className="flex-auto" asChild>
                      <Button variant="destructive" size="icon-xs">
                        Cancel
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCategories?.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="text-center">
                <Button variant="outline" size="icon">
                  <SettingsButton />
                </Button>
              </TableCell>
              <TableCell colSpan={2}>{category.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const VendorTab = () => {
  const { data: vendors, isLoading: isVendorsLoading } = useExpenseVendors();
  const { mutate: updateVendor } = useUpdateVendor();

  const [tempValue, setTempValue] = useState<string>('');

  const [vendorSort, setVendorSort] = useState<'asc' | 'desc'>('asc');

  const handleUpdateVendor = (oldVendorName: string, newVendorName: string) => {
    updateVendor({ oldVendor: oldVendorName, newVendor: newVendorName });
  };

  const sortedVendors = vendors?.sort((a, b) => {
    if (vendorSort === 'asc') {
      return a.localeCompare(b);
    } else {
      return b.localeCompare(a);
    }
  });

  if (isVendorsLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="max-w-2/5">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="max-w-4"></TableHead>
            <TableHead>
              <span
                className="inline-flex items-center gap-2 hover:text-blue-500 hover:cursor-pointer"
                onClick={() => setVendorSort(vendorSort === 'asc' ? 'desc' : 'asc')}
              >
                Vendor Name
                {sortIcon(vendorSort)}
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedVendors?.map((vendor) => (
            <TableRow key={vendor}>
              <TableCell className=" text-center">
                <Popover>
                  <PopoverTrigger
                    asChild
                    onClick={() => setTempValue(vendor)}
                    onBlur={() => setTempValue('')}
                  >
                    <div>
                      <Button variant="outline" size="icon" type="button">
                        <SettingsButton />
                      </Button>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80 z-[9999] bg-white border border-red-500 shadow-xl"
                    side="bottom"
                    align="start"
                  >
                    Update all expense transactions from the selected vendor name to the new name
                    below. This will not affect any other vendors or categories.
                    <FieldGroup key={vendor} className="max-w-sm">
                      <Field orientation="horizontal">
                        <Label htmlFor={`vendor${vendor}`}>New name</Label>
                        <Input
                          onChange={(e) => setTempValue(e.target.value)}
                          id={`vendor${vendor}`}
                          defaultValue={tempValue}
                        />
                      </Field>
                    </FieldGroup>
                    <Button variant="outline" onClick={() => handleUpdateVendor(vendor, tempValue)}>
                      Update
                    </Button>
                    {/* <Button variant="destructive" onClick={() => handleDeleteVendor(vendor)}>
                        Delete
                      </Button> */}
                  </PopoverContent>
                </Popover>
              </TableCell>
              <TableCell>{vendor}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

import { useCategories } from '@/hooks/useCategories';
import { Settings as SettingsButton, Plus } from 'lucide-react';
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

export const Settings = () => {
  const { data: categories, isLoading: isCategoriesLoading } = useCategories();

  return (
    <>
      <div>These are your settings</div>
      <div className="flex">
        <h1>Settings</h1>
      </div>
      <div className="max-w-2/5">
        <div className="flex">
          <h2>Categories</h2>
          <Button variant="outline" size="icon">
            <Plus />
          </Button>
        </div>
        <Table>
          {/* <TableCaption>Categories</TableCaption> */}
          <TableHeader>
            <TableRow>
              <TableHead className="max-w-4"></TableHead>
              <TableHead>Category Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="max-w-4 text-center">
                  <Button variant="outline" size="icon">
                    <SettingsButton />
                  </Button>
                </TableCell>
                <TableCell>{category.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

import { Route, Routes } from 'react-router-dom';
import Home from '../pages/Home';
import ExpenseTable, { ExpenseUpload } from '../pages/ExpenseTable';
import { Charts } from '../pages/Charts';
import { Settings } from '../pages/Settings';
import { PageRoute } from '../pages/PageRoute';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<PageRoute pageTitle="" pageDescription="" Element={Home} />} />
      <Route
        path="/expenses"
        element={
          <PageRoute
            pageTitle="Expenses"
            pageDescription="Import, filter, and manage your expenses"
            Element={ExpenseTable}
            OtherHeaderDetails={<ExpenseUpload />}
          />
        }
      />
      <Route
        path="/income"
        element={
          <PageRoute
            pageTitle="Income"
            pageDescription="Enter income details and track your cashflow"
          />
        }
      />
      <Route
        path="/charts"
        element={
          <PageRoute pageTitle="Charts" pageDescription="Visualize your data" Element={Charts} />
        }
      />
      <Route
        path="/settings"
        element={
          <PageRoute
            pageTitle="Settings"
            pageDescription="Adjust various settings for your expense categories and vendors"
            Element={Settings}
          />
        }
      />
    </Routes>
  );
};

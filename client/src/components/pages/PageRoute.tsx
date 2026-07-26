interface IPageRoute {
  pageTitle: string;
  pageDescription: React.ReactNode;
  OtherHeaderDetails?: React.ReactNode;
  Element?: React.ComponentType;
}

export const PageRoute: React.FC<IPageRoute> = ({
  Element,
  pageTitle,
  pageDescription,
  OtherHeaderDetails,
}) => {
  return (
    <>
      {pageTitle && pageDescription && (
        <div className="mb-6 flex flex-col gap-2 rounded-3xl border border-border bg-card p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{pageTitle}</h1>
              <p className="text-sm text-muted-foreground">{pageDescription}</p>
            </div>
            {OtherHeaderDetails && OtherHeaderDetails}
          </div>
        </div>
      )}
      <div className="p-6">{Element && <Element />}</div>
    </>
  );
};

import { Skeleton } from "@/components/ui";

export default function AdminUserLoading() {
  return (
    <div className="flex flex-col gap-lg">
      <div className="gap-3xs flex flex-col">
        <Skeleton variant="rect" className="h-4 w-32" />
        <Skeleton variant="rect" className="h-8 w-56" />
      </div>
      <Skeleton variant="rect" className="h-16" />
      <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} variant="rect" className="h-20" />
        ))}
      </div>
      <Skeleton variant="rect" className="h-64" />
    </div>
  );
}

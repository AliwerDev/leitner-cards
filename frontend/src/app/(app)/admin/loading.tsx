import { Skeleton } from "@/components/ui";

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-lg">
      <div className="gap-md flex items-start justify-between">
        <Skeleton variant="rect" className="h-8 w-48" />
        <Skeleton variant="rect" className="h-9 w-48" />
      </div>
      <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} variant="rect" className="h-20" />
        ))}
      </div>
      <Skeleton variant="rect" className="h-56" />
    </div>
  );
}

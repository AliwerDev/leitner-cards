import { Skeleton } from "@/components/ui";

export default function DecksLoading() {
  return (
    <div className="flex flex-col gap-lg">
      {/* Mirrors PageHeader: title over subtitle, action to the right. */}
      <div className="gap-md flex items-start justify-between">
        <div className="gap-3xs flex flex-col">
          <Skeleton variant="rect" className="h-8 w-40" />
          <Skeleton variant="rect" className="h-4 w-28" />
        </div>
        <Skeleton variant="rect" className="h-10 w-32" />
      </div>
      <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} variant="rect" className="h-36" />
        ))}
      </div>
    </div>
  );
}

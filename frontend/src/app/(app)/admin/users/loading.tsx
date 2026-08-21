import { Skeleton } from "@/components/ui";

export default function AdminUsersLoading() {
  return (
    <div className="flex flex-col gap-lg">
      <div className="gap-md flex items-start justify-between">
        <div className="gap-3xs flex flex-col">
          <Skeleton variant="rect" className="h-8 w-48" />
          <Skeleton variant="rect" className="h-4 w-32" />
        </div>
        <Skeleton variant="rect" className="h-9 w-48" />
      </div>
      <Skeleton variant="rect" className="h-10 w-full" />
      <Skeleton variant="rect" className="h-96" />
    </div>
  );
}

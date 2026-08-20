import { Skeleton } from "@/components/ui";

export default function DeckDetailLoading() {
  return (
    <div className="flex flex-col gap-xl">
      <Skeleton variant="rect" className="h-20" />
      <div className="grid gap-sm sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} variant="rect" className="h-24" />
        ))}
      </div>
      <Skeleton variant="rect" className="h-64" />
    </div>
  );
}

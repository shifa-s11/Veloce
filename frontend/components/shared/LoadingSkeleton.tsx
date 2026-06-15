export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="flex flex-col space-y-3 rounded-lg border border-border bg-card p-6 shadow-sm animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-5 w-1/3 rounded bg-muted" />
            <div className="h-5 w-16 rounded bg-muted" />
          </div>
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="flex items-center justify-between pt-2">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-4 w-12 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

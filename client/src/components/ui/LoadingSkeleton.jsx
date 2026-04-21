export default function LoadingSkeleton() {
  return (
    <div className="p-4 flex flex-col gap-4 animate-pulse">
      <div className="h-8 bg-surface-3 rounded-lg w-2/3" />
      <div className="h-32 bg-surface-3 rounded-xl" />
      <div className="h-20 bg-surface-3 rounded-xl" />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-surface-3 rounded-xl" />)}
      </div>
    </div>
  );
}

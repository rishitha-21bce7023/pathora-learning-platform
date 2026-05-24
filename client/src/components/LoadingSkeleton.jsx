const LoadingSkeleton = ({ rows = 3 }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-32 rounded bg-slate-800" />
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-12 rounded-xl bg-slate-800/80" />
      ))}
    </div>
  </div>
);

export default LoadingSkeleton;

export default function Loading() {
  return (
    <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-8 w-32" />
      <div className="skeleton h-28" />
      <div className="skeleton h-28" />
      <div className="skeleton h-28" />
    </div>
  );
}

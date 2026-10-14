export function Bone({ className = "" }: { className?: string }) {
  return <div className={`nv-shimmer rounded-xl ${className}`} />;
}

export function PosterGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-5 gap-y-7 sm:grid-cols-[repeat(auto-fill,minmax(176px,1fr))]" aria-label="Cargando películas" role="status">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-2.5">
          <Bone className="aspect-[2/3] rounded-2xl" />
          <Bone className="h-4 w-4/5" />
          <Bone className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-12" role="status" aria-label="Cargando">
      <div className="flex flex-wrap gap-6">
        <Bone className="h-[360px] flex-[999_1_560px] rounded-[28px]" />
        <Bone className="h-[360px] flex-[1_1_300px] rounded-[28px]" />
      </div>
      <Bone className="h-[360px] rounded-[28px]" />
      <PosterGridSkeleton count={6} />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div role="status" aria-label="Cargando">
      <Bone className="h-[340px] rounded-none sm:h-[440px]" />
      <div className="mx-auto -mt-40 flex max-w-[1200px] flex-wrap gap-10 px-4 sm:px-8">
        <Bone className="aspect-[2/3] w-[220px] rounded-[20px] sm:w-[280px]" />
        <div className="flex flex-[999_1_480px] flex-col gap-4 pt-44">
          <Bone className="h-12 w-2/3" />
          <Bone className="h-5 w-1/2" />
          <Bone className="h-28" />
        </div>
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="flex flex-wrap gap-6" role="status" aria-label="Cargando calendario">
      <div className="grid flex-[999_1_640px] grid-cols-7 gap-3 rounded-[28px] bg-surface p-6 shadow-card">
        {Array.from({ length: 35 }, (_, i) => (
          <Bone key={i} className="aspect-[3/4] rounded-[14px]" />
        ))}
      </div>
      <Bone className="h-[420px] flex-[1_1_280px] rounded-[28px]" />
    </div>
  );
}

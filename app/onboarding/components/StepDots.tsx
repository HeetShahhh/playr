interface StepDotsProps {
  total: number;
  current: number; // 0-indexed
}

export function StepDots({ total, current }: StepDotsProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            backgroundColor: i === current ? '#E85D1A' : i < current ? '#B6F000' : 'rgba(255,255,255,0.3)',
          }}
        />
      ))}
    </div>
  );
}

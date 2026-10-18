const ORBITS = Array.from({ length: 46 }, (_, index) => ({
  id: index,
  left: `${(index * 37 + 11) % 100}%`,
  top: `${(index * 53 + 7) % 100}%`,
  size: 2 + ((index * 7) % 4),
  duration: 18 + ((index * 11) % 28),
  delay: -((index * 3) % 24),
  travel: 18 + ((index * 13) % 55),
  opacity: 0.18 + ((index * 17) % 42) / 100,
}));

export default function OrbitField() {
  return (
    <div className="global-orbit-field" aria-hidden="true">
      <div className="global-orbit-field__ring global-orbit-field__ring--one" />
      <div className="global-orbit-field__ring global-orbit-field__ring--two" />
      <div className="global-orbit-field__ring global-orbit-field__ring--three" />
      {ORBITS.map((orbit) => (
        <span
          key={orbit.id}
          className="global-orbit-field__particle"
          style={{
            left: orbit.left,
            top: orbit.top,
            width: `${orbit.size}px`,
            height: `${orbit.size}px`,
            opacity: orbit.opacity,
            animationDuration: `${orbit.duration}s`,
            animationDelay: `${orbit.delay}s`,
            ['--orbit-travel' as string]: `${orbit.travel}px`,
          }}
        />
      ))}
    </div>
  );
}

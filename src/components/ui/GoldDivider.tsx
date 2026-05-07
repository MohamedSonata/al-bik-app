export function GoldDivider() {
  return (
    <div 
      className="h-px w-full" 
      style={{ background: 'linear-gradient(to right, transparent, hsl(35,90%,55%), transparent)' }} 
      data-testid="divider-gold"
    />
  );
}
export function TextWithIcon({
  icon,
  text,
  className = '',
  children,
}: {
  icon: any;
  text: any;
  children?: any;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {icon}
      {text}
      {children}
    </div>
  );
}

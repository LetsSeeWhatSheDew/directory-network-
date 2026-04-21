import Image from "next/image";

type Props = {
  size?: number;
  priority?: boolean;
  className?: string;
};

export default function Logo({ size = 40, priority = false, className }: Props) {
  return (
    <Image
      src="/logo-512.png"
      alt="PuffPrice"
      width={size}
      height={size}
      priority={priority}
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    />
  );
}

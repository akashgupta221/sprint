import Image from 'next/image'

export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/sprint-mark.png"
      alt="Sprint logo"
      width={32}
      height={32}
      className={`rounded-lg object-cover ${className ?? ''}`}
      priority
    />
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <LogoMark />
      <span className="font-heading text-xl font-bold tracking-tight">Sprint</span>
    </span>
  )
}

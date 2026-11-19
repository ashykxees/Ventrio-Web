import { VMark } from "@/components/Logo";

export default function Loading() {
  return (
    <div
      className="container-page flex flex-col items-center justify-center py-32"
      role="status"
      aria-label="Loading"
    >
      <div className="boot-mark scale-75">
        <span className="boot-ring" />
        <VMark className="relative h-12 w-auto text-gold" />
      </div>
      <p className="mt-4 font-mono text-[0.7rem] tracking-[0.3em] text-slate uppercase">
        <span className="text-gold">&gt;</span> loading<span className="boot-caret">_</span>
      </p>
      <div className="route-bar mt-4 h-px w-40 overflow-hidden bg-line-strong">
        <span />
      </div>
    </div>
  );
}

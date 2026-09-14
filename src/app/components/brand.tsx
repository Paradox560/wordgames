export default function Brand() {
  return (
    <span className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="grid h-9 w-9 place-items-center bg-[#1d211d] font-mono text-sm font-black text-[#f3efe4]"
      >
        WE
      </span>
      <span className="wordmark text-xl font-bold">WordEngine</span>
    </span>
  );
}

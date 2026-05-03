export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-neutral-900 flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#171717" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M8 12h8M12 8v8" />
            </svg>
          </div>
          <span className="text-white font-semibold text-lg">Canvas</span>
        </div>

        <div>
          <blockquote className="text-neutral-300 text-xl leading-relaxed">
            "The best way to have a good idea is to have lots of ideas."
          </blockquote>
          <p className="text-neutral-500 mt-4 text-sm">— Linus Pauling</p>
        </div>

        <div className="grid grid-cols-2 gap-3 opacity-30">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-neutral-700" />
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

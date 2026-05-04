import AuthLogo from "@/components/atom/AuthLogo"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-sky-600 flex-col justify-between p-12 relative">
        <img src="/auth_bg.png" alt="auth bg" className="absolute w-[50vw] top-1/5 brightness-0 invert left-0" />
        <AuthLogo />

        <div>
          <blockquote className="text-white text-xl leading-relaxed">
            "The best way to have a good idea is to have lots of ideas."
          </blockquote>
          <p className="text-neutral-300 mt-4 text-sm">— Linus Pauling</p>
        </div>
      </div>

      <div className="flex-1 flex items-center pt-[10vh] sm:justify-center gap-16 p-8 bg-white flex-col lg:flex-row">
        <div className="lg:hidden flex justify-center">
          <AuthLogo />
        </div>
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}

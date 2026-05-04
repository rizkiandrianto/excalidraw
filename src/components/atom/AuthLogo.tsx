export default function AuthLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg overflow-hidden">
        <img
          src="/favicon.png"
          alt="Logo"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col">
        <span className="text-neutral-800 lg:text-white font-semibold text-lg">Canvas</span>
        <span className="text-xs text-neutral-400 lg:text-neutral-300">Powered by Excalidraw</span>
      </div>
    </div>
  );
}

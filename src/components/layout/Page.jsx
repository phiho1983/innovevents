export default function Page({ children }) {
  return (
    <div className="min-h-screen text-zinc-900">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#7b5fae] via-[#b8a3e6] to-white" />
      {children}
    </div>
  );
}

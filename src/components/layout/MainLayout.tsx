export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b p-4 font-semibold">
        My Project
      </header>

      <main className="flex-1 p-6">{children}</main>

      <footer className="border-t p-4 text-sm text-center text-gray-500">
        © {new Date().getFullYear()} My Project
      </footer>
    </div>
  );
}

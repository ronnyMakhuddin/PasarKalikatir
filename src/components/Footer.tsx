export function Footer() {
  return (
    <footer className="w-full border-t">
      <div className="container mx-auto px-4 py-6">
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Pasar Kalikatir. Semua hak dilindungi.
        </p>
      </div>
    </footer>
  );
}

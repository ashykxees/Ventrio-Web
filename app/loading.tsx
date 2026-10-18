export default function Loading() {
  return (
    <div
      className="container-page flex justify-center py-32"
      role="status"
      aria-label="Loading"
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
    </div>
  );
}

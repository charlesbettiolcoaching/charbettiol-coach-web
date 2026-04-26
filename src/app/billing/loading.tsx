export default function BillingLoading() {
  return (
    <main className="min-h-screen bg-white px-6 py-20" style={{ fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>
      <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 h-9 w-32 animate-pulse rounded-lg bg-gray-100" />
        <div className="mb-3 h-8 w-56 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-gray-100" />
      </div>
    </main>
  )
}

export function HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center py-20">
        <h1 className="text-5xl font-bold mb-6">Crossfire Web</h1>
        <p className="text-xl text-gray-400 mb-8">Browser-Based Multiplayer FPS</p>
        <div className="flex justify-center gap-4">
          <a
            href="/register"
            className="px-8 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Get Started
          </a>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Multiple Game Modes</h3>
          <p className="text-gray-400">
            Team Deathmatch, Free for All, Search & Destroy, and more.
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Low Latency</h3>
          <p className="text-gray-400">Sub-100ms gameplay with WebSocket and optimized netcode.</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">No Downloads</h3>
          <p className="text-gray-400">Play directly in your browser with zero installation.</p>
        </div>
      </section>
    </div>
  )
}

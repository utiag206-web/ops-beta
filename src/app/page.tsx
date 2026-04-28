export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-8 text-center">
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Next.js <span className="text-blue-600">Production</span> Base
        </h1>
        <p className="max-w-[600px] text-lg text-muted-foreground mx-auto">
          Arquitectura limpia, escalable y lista para despliegue en Vercel.
          Incluye TypeScript, Tailwind y mejores prácticas de App Router.
        </p>
      </header>

      <section className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3 w-full max-w-4xl">
        <div className="p-6 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold mb-2">Escalabilidad</h3>
          <p className="text-sm text-gray-600">Estructura modular para componentes y librerías.</p>
        </div>
        <div className="p-6 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold mb-2">Tipado Estricto</h3>
          <p className="text-sm text-gray-600">TypeScript configurado para evitar errores en runtime.</p>
        </div>
        <div className="p-6 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold mb-2">Listo para Vercel</h3>
          <p className="text-sm text-gray-600">Configuración optimizada para CI/CD y despliegue rápido.</p>
        </div>
      </section>
    </div>
  );
}

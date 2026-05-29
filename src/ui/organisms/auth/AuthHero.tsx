export default function AuthHero() {
  return (
    <div className="h-full w-full p-3">
      <div className="relative h-full w-full overflow-hidden rounded-2xl">
        <img
          src="/images/auth/auth-container.png"
          alt="MedSphere"
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />

        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="max-w-lg rounded-2xl border border-white/20 bg-black/35 backdrop-blur-xl p-10 text-white shadow-soft">
            <div className="text-sm opacity-80 mb-6">
              MEDSPHERE — Healthcare Operations Platform
            </div>
            <p className="text-3xl font-semibold leading-tight mb-10">
              “We believe coordinated care starts with clear, fast clinical workflows.”
            </p>
            <p className="text-xl leading-relaxed opacity-90">
              MedSphere helps healthcare teams reduce administrative delays and focus on patients.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

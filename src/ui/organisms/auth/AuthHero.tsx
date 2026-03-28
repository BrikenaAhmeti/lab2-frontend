export default function AuthHero() {
  return (
    <div className="h-full w-full p-3">
      <div className="relative h-full w-full overflow-hidden rounded-2xl">
        <img
          src="/images/auth/auth-container.png"
          alt="HotelWorld AI"
          className="h-full w-full object-cover"
        />

        {/* glass card */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="max-w-lg rounded-2xl border border-white/20 bg-black/35 backdrop-blur-xl p-10 text-white shadow-soft">
            <div className="text-sm opacity-80 mb-6">
              HOTELWORLD AI — World’s Best AI Hotel Workers
            </div>
            <p className="text-3xl font-semibold leading-tight mb-10">
              “We believe that people are at the heart of the hotel experience.”
            </p>
            <p className="text-xl leading-relaxed opacity-90">
              Our goal is to free them from mundane administrative tasks,
              allowing them to focus on what truly matters.”
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

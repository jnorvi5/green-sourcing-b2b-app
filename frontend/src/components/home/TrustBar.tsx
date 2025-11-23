export default function TrustBar() {
  const partners = [
    { name: 'EPD International', src: '/assets/partners/epd-logo.png' },
    { name: 'FSC', src: '/assets/partners/fsc-logo.png' },
    { name: 'LEED', src: '/assets/partners/leed-logo.png' },
    { name: 'USGBC', src: '/assets/partners/usgbc-logo.png' },
    { name: 'WAP Sustainability', src: '/assets/partners/wap-logo.svg' },
    { name: 'BREEAM', src: '/assets/partners/breeam-logo.svg' },
    { name: 'BT', src: '/assets/partners/bt-logo.svg' },
  ];

  return (
    <section className="w-full bg-gray-50 border-y border-gray-200 py-8">
      <div className="max-w-screen-xl mx-auto px-4">
        <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">
          Verified Sustainability Data Sourced From
        </p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-12 items-center opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
          {partners.map((partner, index) => (
            <div key={index} className="relative h-12 w-24 md:w-32 hover-lift">
              <img
                src={partner.src}
                alt={`${partner.name} logo`}
                className="h-full w-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const quotes = [
  ['This saves the first hour of A&R back-and-forth on every beat pack.', 'Mika, producer manager'],
  ['The artist-fit notes are exactly the language clients understand.', 'Jay, mixing engineer'],
  ['I use it to tag folders and pitch records faster.', 'Nina, songwriter'],
];

export function Testimonials() {
  return (
    <section id="proof" className="border-y border-white/8 bg-white/[0.025] px-5 py-24">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-display text-4xl font-black md:text-6xl">Made for music teams moving fast.</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {quotes.map(([quote, name]) => (
            <figure key={name} className="glass rounded-xl p-6">
              <blockquote className="text-lg leading-8">&ldquo;{quote}&rdquo;</blockquote>
              <figcaption className="mt-5 text-sm font-bold text-primary">{name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import api from "../api";

function CharitiesPage() {
  const [charities, setCharities] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    api.get("/charities")
      .then((response) => setCharities(response.data.charities || []))
      .catch(() => setCharities([]));
  }, []);

  const categories = useMemo(
    () => ["all", ...new Set(charities.map((charity) => charity.category).filter(Boolean))],
    [charities]
  );

  const filtered = charities.filter((charity) => {
    const matchesQuery =
      charity.name.toLowerCase().includes(query.toLowerCase()) ||
      charity.description.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "all" || charity.category === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.25em] text-brand-400">Charity directory</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
          Explore the causes funded by GreenDraw members.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
          Public visitors can search the directory, review upcoming events, and understand where subscription contributions go.
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-[1fr_220px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search charities"
          className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-brand-400"
        />
        <div className="flex items-center rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-400">
          Category: <span className="ml-2 text-white">{category}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              category === item
                ? "bg-brand-500 text-slate-950"
                : "border border-white/10 bg-slate-900 text-slate-300 hover:border-brand-400 hover:text-brand-300"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((charity) => (
          <article key={charity.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            {charity.image_url ? (
              <img src={charity.image_url} alt={charity.name} className="h-48 w-full object-cover sm:h-52" />
            ) : null}
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-[0.25em] text-brand-400">{charity.category}</span>
                {charity.featured ? (
                  <span className="rounded-full border border-brand-400/30 px-3 py-1 text-xs text-brand-400">Featured</span>
                ) : null}
              </div>
              <h3 className="mt-3 text-xl font-semibold leading-snug text-white">{charity.name}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{charity.description}</p>
              <p className="mt-4 text-sm text-slate-500">Upcoming event: {charity.upcoming_event || "To be announced"}</p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

export default CharitiesPage;

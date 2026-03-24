import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function HomePage() {
  const [featuredCharities, setFeaturedCharities] = useState([]);
  const [latestDraw, setLatestDraw] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/charities?featured=true"), api.get("/draw/latest")])
      .then(([charitiesResponse, drawResponse]) => {
        setFeaturedCharities(charitiesResponse.data.charities || []);
        setLatestDraw(drawResponse.data.draw || null);
      })
      .catch(() => {
        setFeaturedCharities([]);
        setLatestDraw(null);
      });
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <div className="inline-flex rounded-full border border-brand-400/20 bg-brand-500/10 px-4 py-2 text-sm text-brand-400">
            Charity-first golf subscription platform
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Turn every monthly membership into charity impact, verified scores, and draw excitement.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            GreenDraw blends score tracking, recurring subscription access, public charity storytelling,
            and monthly draw rewards into one modern platform built for selection-grade full-stack delivery.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/signup"
              className="rounded-full bg-brand-500 px-6 py-3 font-medium text-slate-950 transition hover:bg-brand-400"
            >
              Create account
            </Link>
            <Link
              to="/charities"
              className="rounded-full border border-white/15 px-6 py-3 font-medium text-white transition hover:border-brand-400 hover:text-brand-400"
            >
              Explore charities
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-semibold text-white">How it works</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>1. Choose a plan and select your charity at signup.</p>
              <p>2. Keep your latest five Stableford scores on record.</p>
              <p>3. Admin runs a monthly random or algorithmic draw.</p>
              <p>4. Winners upload proof and admins verify payouts.</p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-semibold text-white">Latest draw</h3>
            {latestDraw ? (
              <>
                <p className="mt-2 text-sm text-slate-400">{latestDraw.draw_month}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {latestDraw.numbers.map((number) => (
                    <span key={number} className="rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                      {number}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-400">No official draw has been published yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand-400">Featured charities</p>
            <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">The impact side of GreenDraw</h2>
          </div>
          <Link to="/charities" className="text-sm text-brand-400 transition hover:text-brand-300">
            View all charities
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {featuredCharities.map((charity) => (
            <article key={charity.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              {charity.image_url ? (
                <img src={charity.image_url} alt={charity.name} className="h-56 w-full object-cover" />
              ) : null}
              <div className="p-6">
                <div className="text-xs uppercase tracking-[0.25em] text-brand-400">{charity.category}</div>
                <h3 className="mt-3 text-2xl font-semibold text-white">{charity.name}</h3>
                <p className="mt-3 text-slate-300">{charity.description}</p>
                <p className="mt-4 text-sm text-slate-500">Next event: {charity.upcoming_event || "To be announced"}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default HomePage;

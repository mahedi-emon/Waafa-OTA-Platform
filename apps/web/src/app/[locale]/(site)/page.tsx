import { HomeJsonLd } from "./_components/home/HomeJsonLd";
import { HomeSections } from "./_components/home/HomeSections";

/** Home (A7): the 13 admin-ordered sections from PRD §7, with the search card in the hero. */
export default function HomePage() {
  return (
    <main id="main" className="pb-24 md:pb-8">
      <HomeSections />
      <HomeJsonLd />
    </main>
  );
}

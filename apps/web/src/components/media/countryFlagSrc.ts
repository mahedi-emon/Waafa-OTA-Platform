/** ISO 3166-1 alpha-2 codes with a flag in /media/flags (flag-icons 7.2.3, MIT), plus "eu" for Schengen. */
const FLAG_CODES = new Set(
  "ad ae af ag ai al am ao aq ar as at au aw ax az ba bb bd be bf bg bh bi bj bl bm bn bo bq br bs bt bv bw by bz ca cc cd cf cg ch ci ck cl cm cn co cp cr cu cv cw cx cy cz de dg dj dk dm do dz ec ee eg eh er es et eu fi fj fk fm fo fr ga gb gd ge gf gg gh gi gl gm gn gp gq gr gs gt gu gw gy hk hm hn hr ht hu ic id ie il im in io iq ir is it je jm jo jp ke kg kh ki km kn kp kr kw ky kz la lb lc li lk lr ls lt lu lv ly ma mc md me mf mg mh mk ml mm mn mo mp mq mr ms mt mu mv mw mx my mz na nc ne nf ng ni nl no np nr nu nz om pa pc pe pf pg ph pk pl pm pn pr ps pt pw py qa re ro rs ru rw sa sb sc sd se sg sh si sj sk sl sm sn so sr ss st sv sx sy sz tc td tf tg th tj tk tl tm tn to tr tt tv tw tz ua ug um un us uy uz va vc ve vg vi vn vu wf ws xk xx ye yt za zm zw".split(
    " ",
  ),
);

/** Codes some records use that are not ISO 3166-1. */
const ALIASES: Record<string, string> = { uk: "gb", el: "gr" };

/** The flag file for a two-letter country code, or null when there is none (the caller shows the code instead). */
export function countryFlagSrc(code: string | null | undefined): string | null {
  if (!code) return null;
  const lower = code.trim().toLowerCase();
  const iso = ALIASES[lower] ?? lower;
  return FLAG_CODES.has(iso) ? `/media/flags/${iso}.svg` : null;
}

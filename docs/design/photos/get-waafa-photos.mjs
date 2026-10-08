// Downloads every real photo used in the WAAFA prototype into this folder (photos/).
// Run it here on your own computer (Node 18 or newer, internet):   node get-waafa-photos.mjs
// Then open index.html again: every photo slot shows the real photo instead of the drawn stand-in.
// Later, for the Next.js build, copy the same files to apps/web/public/images/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PHOTOS = [
{
"key": "hero-wing",
"subject": "Airplane wing over clouds at sunrise",
"photographer": "Nicholas Szewczyk",
"page": "https://unsplash.com/photos/QAemWFs90tU",
"url": "https://images.unsplash.com/photo-1647363377737-8d0ad7c2f494?auto=format&fit=crop&w=1600&q=80"
},
{
"key": "hero-wing-alt",
"subject": "Airplane wing over clouds",
"photographer": "Johny Goerend",
"page": "https://unsplash.com/photos/KB9r_hTzyeQ",
"url": "https://images.unsplash.com/photo-1593182440709-4b7b56482c55?auto=format&fit=crop&w=1600&q=80"
},
{
"key": "flights",
"subject": "Aircraft, flights and group fares",
"photographer": "Blake Guidry",
"page": "https://unsplash.com/photos/p9vr45T2scg",
"url": "https://images.unsplash.com/photo-1530469641172-8ac15d0a7d6a?auto=format&fit=crop&w=1600&q=80"
},
{
"key": "coxsbazar",
"subject": "Cox's Bazar beach",
"photographer": "Masum Ahmed",
"page": "https://unsplash.com/photos/dXj8iSUCydo",
"url": "https://images.unsplash.com/photo-1711077470004-cb6a7258c082?auto=format&fit=crop&w=1600&q=80"
},
{
"key": "coxsbazar-alt",
"subject": "Cox's Bazar",
"photographer": "Nafiul Hasan",
"page": "https://unsplash.com/photos/veIrXDU9WQI",
"url": "https://images.unsplash.com/photo-1609501285437-4eb001f82684?auto=format&fit=crop&w=900&q=80"
},
{
"key": "sajek",
"subject": "Sajek Valley above the clouds",
"photographer": "Sium Ahameed Bhuyan",
"page": "https://unsplash.com/photos/TAUjeniJWjs",
"url": "https://images.unsplash.com/photo-1673632417072-b1366fda0e22?auto=format&fit=crop&w=900&q=80"
},
{
"key": "sajek-alt",
"subject": "Sajek Valley",
"photographer": "Sium Ahameed Bhuyan",
"page": "https://unsplash.com/photos/ADFyoO70OVA",
"url": "https://images.unsplash.com/photo-1673632417265-a7bcbc90383c?auto=format&fit=crop&w=900&q=80"
},
{
"key": "maldives",
"subject": "Maldives overwater villas",
"photographer": "Ishan @seefromthesky",
"page": "https://unsplash.com/photos/DtWyp_4YEes",
"url": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1600&q=80"
},
{
"key": "maldives-alt",
"subject": "Maldives",
"photographer": "Rayyu Maldives",
"page": "https://unsplash.com/photos/4F4OtnNjpmc",
"url": "https://images.unsplash.com/photo-1574226780565-388f10f8121e?auto=format&fit=crop&w=900&q=80"
},
{
"key": "dubai",
"subject": "Dubai skyline",
"photographer": "David Rodrigo",
"page": "https://unsplash.com/photos/Fr6zexbmjmc",
"url": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80"
},
{
"key": "dubai-desert",
"subject": "Dubai desert",
"photographer": "Fredrik Öhlander",
"page": "https://unsplash.com/photos/fCW1hWq2nq0",
"url": "https://images.unsplash.com/photo-1528702748617-c64d49f918af?auto=format&fit=crop&w=900&q=80"
},
{
"key": "nepal",
"subject": "Nepal",
"photographer": "Giuseppe Mondì",
"page": "https://unsplash.com/photos/xyE1p1rG04U",
"url": "https://images.unsplash.com/photo-1518002054494-3a6f94352e9d?auto=format&fit=crop&w=1600&q=80"
},
{
"key": "nepal-alt",
"subject": "Nepal",
"photographer": "Meera Pankhania",
"page": "https://unsplash.com/photos/7cENZhgyf7c",
"url": "https://images.unsplash.com/photo-1562462181-b228e3cff9ad?auto=format&fit=crop&w=900&q=80"
},
{
"key": "cappadocia",
"subject": "Cappadocia balloons",
"photographer": "Chloé Lefleur",
"page": "https://unsplash.com/photos/ygtKS8lyjb4",
"url": "https://images.unsplash.com/photo-1699519324068-8cade0601b53?auto=format&fit=crop&w=900&q=80"
},
{
"key": "cappadocia-alt",
"subject": "Cappadocia, Türkiye",
"photographer": "Ricky LK",
"page": "https://unsplash.com/photos/sqWpPdIU_ao",
"url": "https://images.unsplash.com/photo-1680469814298-9a1220de2cf2?auto=format&fit=crop&w=1600&q=80"
},
{
"key": "bali",
"subject": "Bali temple",
"photographer": "Aron Visuals",
"page": "https://unsplash.com/photos/1kdIG_258bU",
"url": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=80"
},
{
"key": "bali-alt",
"subject": "Bali",
"photographer": "Harry Kessell",
"page": "https://unsplash.com/photos/eE2trMn-6a0",
"url": "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=900&q=80"
},
{
"key": "thailand",
"subject": "Thailand islands",
"photographer": "Humphrey M",
"page": "https://unsplash.com/photos/TejFa7VW5e4",
"url": "https://images.unsplash.com/photo-1534008897995-27a23e859048?auto=format&fit=crop&w=1600&q=80"
},
{
"key": "thailand-alt",
"subject": "Thailand",
"photographer": "Evan Krause",
"page": "https://unsplash.com/photos/BU6lABNbTpA",
"url": "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?auto=format&fit=crop&w=900&q=80"
},
{
"key": "singapore",
"subject": "Singapore Marina Bay",
"photographer": "Hu Chen",
"page": "https://unsplash.com/photos/__cBlRzLSTg",
"url": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=80"
},
{
"key": "kualalumpur",
"subject": "Kuala Lumpur, Petronas Towers",
"photographer": "Ismail Bashiri",
"page": "https://unsplash.com/photos/GdjZs5JZwZA",
"url": "https://images.unsplash.com/photo-1597148543182-830ef7bbb904?auto=format&fit=crop&w=1600&q=80"
},
{
"key": "visa",
"subject": "Passport and boarding pass",
"photographer": "Kit",
"page": "https://unsplash.com/photos/htQznS-Rx7w",
"url": "https://images.unsplash.com/photo-1581553673739-c4906b5d0de8?auto=format&fit=crop&w=1600&q=80"
},
{
"key": "visa-alt",
"subject": "Passport and travel",
"photographer": "Nicole Geri",
"page": "https://unsplash.com/photos/gMJ3tFOLvnA",
"url": "https://images.unsplash.com/photo-1454496406107-dc34337da8d6?auto=format&fit=crop&w=900&q=80"
},
{
"key": "printing",
"subject": "Office printer",
"photographer": "Mahrous Houses",
"page": "https://unsplash.com/photos/5AoOejjRUrA",
"url": "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=1600&q=80"
},
{
"key": "printing-alt",
"subject": "Toner cartridge and printing (also the sample toner product)",
"photographer": "Jakub Żerdzicki",
"page": "https://unsplash.com/photos/Da9qsu-0a00",
"url": "https://images.unsplash.com/photo-1706895040634-62055892cbbb?auto=format&fit=crop&w=1200&q=80"
},
{
"key": "trading",
"subject": "Container port, international trading",
"photographer": "Andy Li",
"page": "https://unsplash.com/photos/CpsTAUPoScw",
"url": "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1600&q=80"
},
{
"key": "trading-alt",
"subject": "Shipping and trade",
"photographer": "Ali Mkumbwa",
"page": "https://unsplash.com/photos/Annl9CjEaEs",
"url": "https://images.unsplash.com/photo-1678182451047-196f22a4143e?auto=format&fit=crop&w=900&q=80"
},
{
"key": "prod-tshirt",
"subject": "Sample product: T-shirt (size and colour variants)",
"photographer": "Md Salman",
"page": "https://unsplash.com/photos/tWOz2_EK5EQ",
"url": "https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1200&q=80"
},
{
"key": "prod-powerbank",
"subject": "Sample product: power bank (capacity variants)",
"photographer": "I'M ZION",
"page": "https://unsplash.com/photos/APdfyW0Aq-E",
"url": "https://images.unsplash.com/photo-1566554738544-d962991c3fee?auto=format&fit=crop&w=1200&q=80"
},
{
"key": "prod-headphones",
"subject": "Sample product: wireless headphones (colour variants)",
"photographer": "C D-X",
"page": "https://unsplash.com/photos/PDX_a_82obo",
"url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80"
},
{
"key": "cat-stationery",
"subject": "Sample category tile: Office & Stationery",
"photographer": "Joanna Kosinska",
"page": "https://unsplash.com/photos/bF2vsubyHcQ",
"url": "https://images.unsplash.com/photo-1510070009289-b5bc34383727?auto=format&fit=crop&w=900&q=80"
}
];

const out = path.dirname(fileURLToPath(import.meta.url));
fs.mkdirSync(out, { recursive: true });
let ok = 0;
for (const p of PHOTOS) {
  try {
    const res = await fetch(p.url + '&fm=jpg');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(out, p.key + '.jpg'), buf);
    ok++;
    console.log('ok  ', p.key.padEnd(18), Math.round(buf.length / 1024) + ' KB', '-', p.photographer);
  } catch (e) {
    console.log('FAIL', p.key, e.message);
  }
}
fs.writeFileSync(path.join(out, 'CREDITS.txt'),
  PHOTOS.map(p => `${p.key}.jpg - ${p.subject} - photo by ${p.photographer} on Unsplash - ${p.page}`).join('\n') + '\n');
console.log(`\nDone: ${ok}/${PHOTOS.length} photos saved in ${out}`);
console.log('Next: open index.html again. The prototype now shows these photos.');

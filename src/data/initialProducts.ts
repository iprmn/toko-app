export interface DepartmentConfig {
  id: string;
  name: string;
  icon: string;
  defaultUnit: string;
  suggestedUnits: string[];
  suggestedCategories: { id: string; label: string }[];
  iconKeys: string[];
}

export const MASTER_DEPARTMENTS: DepartmentConfig[] = [
  {
    id: 'sembako',
    name: 'Sembako & Makanan',
    icon: '🍚',
    defaultUnit: 'bks',
    suggestedUnits: ['bks', 'kg', 'pcs', 'pouch', 'karung', 'butir', 'dus'],
    suggestedCategories: [
      { id: 'sembako', label: '🍚 Sembako' },
      { id: 'makanan', label: '🍜 Makanan' },
      { id: 'bumbu', label: '🧂 Bumbu Dapur' },
      { id: 'snack', label: '🍪 Snack & Biskuit' },
      { id: 'sayur-buah', label: '🥕 Sayur & Buah' },
    ],
    iconKeys: ['rice', 'oil', 'egg', 'sugar', 'noodle', 'bread', 'snack', 'sauce', 'meat', 'fish', 'veggie', 'fruit'],
  },
  {
    id: 'minuman',
    name: 'Minuman Segar & Kopi',
    icon: '☕',
    defaultUnit: 'botol',
    suggestedUnits: ['botol', 'cup', 'kaleng', 'renceng', 'kotak', 'dus', 'pcs'],
    suggestedCategories: [
      { id: 'kopi-teh', label: '☕ Kopi & Teh' },
      { id: 'air-mineral', label: '💧 Air Mineral' },
      { id: 'susu', label: '🥛 Susu Olahan' },
      { id: 'jus-soda', label: '🥤 Jus & Soda' },
    ],
    iconKeys: ['coffee', 'icedcoffee', 'tea', 'water', 'milk', 'soda', 'juice', 'coconut', 'can', 'bottle'],
  },
  {
    id: 'elektronik',
    name: 'Elektronik & Gadget',
    icon: '⚡',
    defaultUnit: 'unit',
    suggestedUnits: ['unit', 'pcs', 'set', 'meter', 'box', 'kotak'],
    suggestedCategories: [
      { id: 'gadget', label: '📱 HP & Aksesoris' },
      { id: 'audio-kabel', label: '🎧 Audio & Kabel' },
      { id: 'listrik', label: '💡 Lampu & Kelistrikan' },
      { id: 'komputer', label: '💻 Komputer & Laptop' },
      { id: 'elektronik-rumah', label: '🔌 Elektronik Rumah' },
    ],
    iconKeys: ['phone', 'laptop', 'headphones', 'cable', 'bulb', 'battery', 'tv', 'camera', 'fan', 'mouse', 'speaker', 'gamepad'],
  },
  {
    id: 'pakaian',
    name: 'Pakaian & Fashion',
    icon: '👕',
    defaultUnit: 'pcs',
    suggestedUnits: ['pcs', 'pasang', 'lusin', 'lembar', 'set', 'potong'],
    suggestedCategories: [
      { id: 'atasan', label: '👕 Kaos & Kemeja' },
      { id: 'bawahan', label: '👖 Celana & Rok' },
      { id: 'jaket', label: '🧥 Jaket & Outer' },
      { id: 'alas-kaki', label: '👟 Sepatu & Sandal' },
      { id: 'busana-muslim', label: '🧕 Busana Muslim' },
    ],
    iconKeys: ['tshirt', 'shirt', 'pants', 'jacket', 'dress', 'shoes', 'sandals', 'socks', 'hat', 'hijab', 'swimsuit', 'suit'],
  },
  {
    id: 'aksesoris',
    name: 'Aksesoris & Perhiasan',
    icon: '👜',
    defaultUnit: 'pcs',
    suggestedUnits: ['pcs', 'buah', 'set', 'pasang', 'kotak'],
    suggestedCategories: [
      { id: 'perhiasan', label: '💍 Perhiasan & Cincin' },
      { id: 'jam-tangan', label: '⌚ Jam Tangan' },
      { id: 'tas-dompet', label: '👜 Tas & Dompet' },
      { id: 'kacamata', label: '👓 Kacamata' },
      { id: 'aksesoris-diri', label: '🧢 Topi & Sabuk' },
    ],
    iconKeys: ['watch', 'bag', 'backpack', 'wallet', 'glasses', 'ring', 'necklace', 'belt', 'umbrella', 'perfume', 'keychain', 'case'],
  },
  {
    id: 'kebersihan',
    name: 'Kebersihan & Kosmetik',
    icon: '🧼',
    defaultUnit: 'pcs',
    suggestedUnits: ['pcs', 'pouch', 'botol', 'tube', 'batang', 'bks', 'kotak'],
    suggestedCategories: [
      { id: 'sabun-mandi', label: '🧼 Sabun & Sampo' },
      { id: 'cuci-piring', label: '🍋 Cuci Piring & Baju' },
      { id: 'skincare', label: '💄 Kosmetik & Bedak' },
      { id: 'perawatan-gigi', label: '🪥 Perawatan Gigi' },
    ],
    iconKeys: ['soap', 'dishwash', 'detergent', 'shampoo', 'toothbrush', 'toothpaste', 'tissue', 'mop', 'cosmetics', 'skincare'],
  },
  {
    id: 'atk',
    name: 'ATK & Toko Buku',
    icon: '📚',
    defaultUnit: 'pcs',
    suggestedUnits: ['pcs', 'buku', 'pak', 'rim', 'set', 'lembar'],
    suggestedCategories: [
      { id: 'alat-tulis', label: '✏️ Pulpen & Pensil' },
      { id: 'buku-kertas', label: '📓 Buku & Kertas' },
      { id: 'alat-kantor', label: '✂️ Perlengkapan Kantor' },
    ],
    iconKeys: ['book', 'pen', 'pencil', 'scissors', 'ruler', 'paper', 'calculator', 'stapler', 'envelope', 'paint'],
  },
  {
    id: 'lainnya',
    name: 'Lainnya & Serba-Serbi',
    icon: '📦',
    defaultUnit: 'pcs',
    suggestedUnits: ['pcs', 'buah', 'unit', 'set', 'box', 'bungkus'],
    suggestedCategories: [
      { id: 'perkakas', label: '🔧 Perkakas & Alat' },
      { id: 'obat-p3k', label: '💊 Obat & P3K' },
      { id: 'mainan', label: '🧸 Mainan Anak' },
      { id: 'rokok-korek', label: '🚬 Rokok & Korek' },
      { id: 'serba-serbi', label: '📦 Umum / Lainnya' },
    ],
    iconKeys: ['box', 'tools', 'hammer', 'tape', 'pill', 'medkit', 'toy', 'gift', 'cigarette', 'lighter'],
  },
];

export const CATEGORIES = [
  { id: 'all', label: 'Semua Barang', icon: '🏪' },
  { id: 'low-stock', label: 'Stok Menipis', icon: '⚠️' },
  { id: 'sembako', label: 'Sembako', icon: '🍚' },
  { id: 'makanan', label: 'Makanan', icon: '🍜' },
  { id: 'minuman', label: 'Minuman', icon: '☕' },
  { id: 'bumbu', label: 'Bumbu Dapur', icon: '🧂' },
  { id: 'kebersihan', label: 'Sabun & Cuci', icon: '🧼' },
  { id: 'elektronik', label: 'Elektronik', icon: '⚡' },
  { id: 'pakaian', label: 'Pakaian', icon: '👕' },
  { id: 'aksesoris', label: 'Aksesoris', icon: '👜' },
  { id: 'atk', label: 'ATK & Buku', icon: '📚' },
  { id: 'lainnya', label: 'Lainnya', icon: '📦' },
];

export const PRESET_ICONS: { [key: string]: { label: string; icon: string; bg: string } } = {
  // Sembako & Makanan
  rice: { label: 'Beras & Karung', icon: '🍚', bg: 'bg-emerald-50 text-emerald-700' },
  oil: { label: 'Minyak Goreng', icon: '🍶', bg: 'bg-amber-50 text-amber-700' },
  egg: { label: 'Telur Ayam', icon: '🥚', bg: 'bg-orange-50 text-orange-700' },
  sugar: { label: 'Gula & Tepung', icon: '🍬', bg: 'bg-rose-50 text-rose-700' },
  noodle: { label: 'Mie Instan', icon: '🍜', bg: 'bg-yellow-50 text-yellow-700' },
  bread: { label: 'Roti & Kue', icon: '🍞', bg: 'bg-amber-50 text-amber-800' },
  snack: { label: 'Snack / Biskuit', icon: '🍪', bg: 'bg-purple-50 text-purple-700' },
  sauce: { label: 'Kecap & Saus', icon: '🥫', bg: 'bg-red-50 text-red-700' },
  meat: { label: 'Daging Sapi/Ayam', icon: '🥩', bg: 'bg-rose-50 text-rose-700' },
  fish: { label: 'Ikan & Seafood', icon: '🐟', bg: 'bg-sky-50 text-sky-700' },
  veggie: { label: 'Sayuran', icon: '🥕', bg: 'bg-emerald-50 text-emerald-800' },
  fruit: { label: 'Buah Segar', icon: '🍎', bg: 'bg-red-50 text-red-600' },

  // Minuman
  coffee: { label: 'Kopi & Renceng', icon: '☕', bg: 'bg-stone-50 text-stone-700' },
  icedcoffee: { label: 'Es Kopi / Boba', icon: '🧋', bg: 'bg-amber-50 text-amber-900' },
  tea: { label: 'Teh & Kotak', icon: '🧃', bg: 'bg-teal-50 text-teal-700' },
  water: { label: 'Air Mineral', icon: '💧', bg: 'bg-sky-50 text-sky-700' },
  milk: { label: 'Susu Segar', icon: '🥛', bg: 'bg-indigo-50 text-indigo-700' },
  soda: { label: 'Minuman Soda', icon: '🥤', bg: 'bg-rose-50 text-rose-700' },
  juice: { label: 'Jus Buah', icon: '🍹', bg: 'bg-orange-50 text-orange-700' },
  coconut: { label: 'Kelapa Muda', icon: '🥥', bg: 'bg-emerald-50 text-emerald-700' },
  can: { label: 'Minuman Kaleng', icon: '🥫', bg: 'bg-red-50 text-red-700' },
  bottle: { label: 'Minuman Botol', icon: '🍾', bg: 'bg-emerald-50 text-emerald-700' },

  // Elektronik & Gadget
  phone: { label: 'Smartphone / HP', icon: '📱', bg: 'bg-blue-50 text-blue-700' },
  laptop: { label: 'Laptop / Komputer', icon: '💻', bg: 'bg-slate-100 text-slate-800' },
  headphones: { label: 'Headphone / TWS', icon: '🎧', bg: 'bg-indigo-50 text-indigo-700' },
  cable: { label: 'Kabel / Charger', icon: '🔌', bg: 'bg-teal-50 text-teal-700' },
  bulb: { label: 'Lampu Bohlam', icon: '💡', bg: 'bg-yellow-50 text-yellow-700' },
  battery: { label: 'Baterai / Powerbank', icon: '🔋', bg: 'bg-emerald-50 text-emerald-700' },
  tv: { label: 'TV & Monitor', icon: '📺', bg: 'bg-slate-100 text-slate-700' },
  camera: { label: 'Kamera Digital', icon: '📷', bg: 'bg-zinc-100 text-zinc-800' },
  fan: { label: 'Kipas Angin', icon: '🌀', bg: 'bg-cyan-50 text-cyan-700' },
  mouse: { label: 'Mouse / Keyboard', icon: '🖱️', bg: 'bg-stone-100 text-stone-700' },
  speaker: { label: 'Speaker Bluetooth', icon: '🔊', bg: 'bg-violet-50 text-violet-700' },
  gamepad: { label: 'Stik Game / Konsol', icon: '🎮', bg: 'bg-purple-50 text-purple-700' },

  // Pakaian & Fashion
  tshirt: { label: 'Kaos / Baju', icon: '👕', bg: 'bg-blue-50 text-blue-700' },
  shirt: { label: 'Kemeja Formal', icon: '👔', bg: 'bg-indigo-50 text-indigo-700' },
  pants: { label: 'Celana Panjang/Pendek', icon: '👖', bg: 'bg-sky-50 text-sky-800' },
  jacket: { label: 'Jaket / Hoodie', icon: '🧥', bg: 'bg-amber-50 text-amber-800' },
  dress: { label: 'Gaun / Gamis', icon: '👗', bg: 'bg-pink-50 text-pink-700' },
  shoes: { label: 'Sepatu', icon: '👟', bg: 'bg-emerald-50 text-emerald-700' },
  sandals: { label: 'Sandal Jepit/Slop', icon: '🩴', bg: 'bg-orange-50 text-orange-700' },
  socks: { label: 'Kaos Kaki', icon: '🧦', bg: 'bg-violet-50 text-violet-700' },
  hat: { label: 'Topi', icon: '🧢', bg: 'bg-red-50 text-red-700' },
  hijab: { label: 'Hijab / Kerudung', icon: '🧕', bg: 'bg-rose-50 text-rose-700' },
  swimsuit: { label: 'Pakaian Renang', icon: '🩱', bg: 'bg-cyan-50 text-cyan-700' },
  suit: { label: 'Baju Olahraga', icon: '🥋', bg: 'bg-slate-100 text-slate-800' },

  // Aksesoris & Perhiasan
  watch: { label: 'Jam Tangan', icon: '⌚', bg: 'bg-amber-50 text-amber-800' },
  bag: { label: 'Tas Tangan / Wanita', icon: '👜', bg: 'bg-rose-50 text-rose-700' },
  backpack: { label: 'Tas Ransel / Sekolah', icon: '🎒', bg: 'bg-blue-50 text-blue-700' },
  wallet: { label: 'Dompet Kulit', icon: '👛', bg: 'bg-pink-50 text-pink-700' },
  glasses: { label: 'Kacamata', icon: '👓', bg: 'bg-stone-100 text-stone-800' },
  ring: { label: 'Cincin / Emas', icon: '💍', bg: 'bg-yellow-50 text-yellow-700' },
  necklace: { label: 'Kalung / Gelang', icon: '📿', bg: 'bg-emerald-50 text-emerald-700' },
  belt: { label: 'Ikat Pinggang / Gesper', icon: '🥋', bg: 'bg-stone-100 text-stone-700' },
  umbrella: { label: 'Payung Lipat', icon: '🌂', bg: 'bg-purple-50 text-purple-700' },
  perfume: { label: 'Parfum / Wewangian', icon: '🌸', bg: 'bg-pink-50 text-pink-700' },
  keychain: { label: 'Gantungan Kunci', icon: '🔑', bg: 'bg-amber-50 text-amber-700' },
  case: { label: 'Casing / Pelindung HP', icon: '🛡️', bg: 'bg-teal-50 text-teal-700' },

  // Kebersihan & Kosmetik
  soap: { label: 'Sabun Mandi', icon: '🧼', bg: 'bg-blue-50 text-blue-700' },
  dishwash: { label: 'Cuci Piring', icon: '🍋', bg: 'bg-lime-50 text-lime-700' },
  detergent: { label: 'Deterjen Baju', icon: '🧺', bg: 'bg-indigo-50 text-indigo-700' },
  shampoo: { label: 'Sampo Rambut', icon: '🧴', bg: 'bg-cyan-50 text-cyan-700' },
  toothbrush: { label: 'Sikat Gigi', icon: '🪥', bg: 'bg-teal-50 text-teal-700' },
  toothpaste: { label: 'Pasta Gigi', icon: '🫧', bg: 'bg-sky-50 text-sky-700' },
  tissue: { label: 'Tisu Gulung/Wajah', icon: '🧻', bg: 'bg-slate-100 text-slate-700' },
  mop: { label: 'Sapu & Pel', icon: '🧹', bg: 'bg-amber-50 text-amber-800' },
  cosmetics: { label: 'Lipstik & Bedak', icon: '💄', bg: 'bg-rose-50 text-rose-700' },
  skincare: { label: 'Serum & Skincare', icon: '✨', bg: 'bg-violet-50 text-violet-700' },

  // ATK & Toko Buku
  book: { label: 'Buku Tulis / Catatan', icon: '📓', bg: 'bg-blue-50 text-blue-700' },
  pen: { label: 'Pulpen / Spidol', icon: '✒️', bg: 'bg-slate-100 text-slate-800' },
  pencil: { label: 'Pensil Kayu / Mekanik', icon: '✏️', bg: 'bg-amber-50 text-amber-700' },
  scissors: { label: 'Gunting & Cutter', icon: '✂️', bg: 'bg-red-50 text-red-700' },
  ruler: { label: 'Penggaris', icon: '📏', bg: 'bg-yellow-50 text-yellow-800' },
  paper: { label: 'Kertas HVS / Rim', icon: '📄', bg: 'bg-zinc-100 text-zinc-700' },
  calculator: { label: 'Kalkulator', icon: '🧮', bg: 'bg-emerald-50 text-emerald-700' },
  stapler: { label: 'Staples & Klip', icon: '📎', bg: 'bg-sky-50 text-sky-700' },
  envelope: { label: 'Amplop Surat', icon: '✉️', bg: 'bg-amber-50 text-amber-700' },
  paint: { label: 'Cat Air & Kuas', icon: '🎨', bg: 'bg-purple-50 text-purple-700' },

  // Lainnya & Serba-serbi
  box: { label: 'Paket / Dus', icon: '📦', bg: 'bg-slate-100 text-slate-700' },
  tools: { label: 'Obeng & Kunci Pas', icon: '🔧', bg: 'bg-stone-100 text-stone-800' },
  hammer: { label: 'Palu & Paku', icon: '🔨', bg: 'bg-amber-50 text-amber-800' },
  tape: { label: 'Lakban & Solasi', icon: '🩹', bg: 'bg-orange-50 text-orange-700' },
  pill: { label: 'Obat & Vitamin', icon: '💊', bg: 'bg-rose-50 text-rose-700' },
  medkit: { label: 'Kotak P3K', icon: '🩺', bg: 'bg-red-50 text-red-700' },
  toy: { label: 'Mainan Anak', icon: '🧸', bg: 'bg-yellow-50 text-yellow-700' },
  gift: { label: 'Hadiah & Souvenir', icon: '🎁', bg: 'bg-pink-50 text-pink-700' },
  cigarette: { label: 'Rokok', icon: '🚬', bg: 'bg-stone-100 text-stone-700' },
  lighter: { label: 'Korek Api', icon: '🔥', bg: 'bg-orange-50 text-orange-700' },
};

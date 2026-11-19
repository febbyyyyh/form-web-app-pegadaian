import type { Database, Form, FormResponse, User } from "./types";

export const DEFAULT_UNITS = [
  "Operasional",
  "Keuangan",
  "HRD",
  "IT",
  "Support",
  "Security",
  "Driver",
  "OB",
];

const DAY = 86_400_000;

export function createSeed(now = Date.now()): Database {
  const at = (daysAgo: number, hour = 9) =>
    new Date(now - daysAgo * DAY - (24 - hour) * 3_600_000).toISOString();

  const users: User[] = [
    {
      id: "usr_admin",
      username: "admin",
      password: "admin123",
      name: "Admin Kanwil",
      email: "admin@kanwil.pegadaian.co.id",
      unit: "IT",
      tagline: "Siap bantu semua form kamu ✨",
      role: "admin",
      active: true,
      createdAt: at(60),
    },
    {
      id: "usr_febi",
      username: "febi",
      password: "user123",
      name: "Febiola Lengkong",
      email: "febi@kanwil.pegadaian.co.id",
      unit: "Operasional",
      tagline: "Kopi dulu, baru kerja ☕",
      role: "user",
      active: true,
      createdAt: at(40),
    },
    ...(
      [
        ["rizky", "Rizky Pratama", "Keuangan"],
        ["sinta", "Sinta Maharani", "HRD"],
        ["andre", "Andre Wijaya", "IT"],
        ["dewi", "Dewi Lestari", "Support"],
        ["bayu", "Bayu Saputra", "Security"],
        ["joko", "Joko Santoso", "Driver"],
        ["maya", "Maya Kristanti", "Operasional"],
        ["udin", "Udin Hidayat", "OB"],
        ["nadia", "Nadia Putri", "Keuangan"],
      ] as const
    ).map(
      ([username, name, unit], i): User => ({
        id: `usr_${username}`,
        username,
        password: "user123",
        name,
        email: `${username}@kanwil.pegadaian.co.id`,
        unit,
        role: "user",
        active: true,
        createdAt: at(30 - i),
      }),
    ),
  ];

  const forms: Form[] = [
    {
      id: "frm_survei",
      code: "SURVEI26",
      title: "Survei Kepuasan Layanan Internal 2026",
      description:
        "Bantu kami bikin layanan internal Kanwil makin oke. Cuma 2 menit, janji! 💚",
      emoji: "📊",
      active: true,
      createdAt: at(12),
      updatedAt: at(12),
      questions: [
        {
          id: "q_rating",
          type: "rating",
          label: "Seberapa puas kamu dengan layanan internal bulan ini?",
          required: true,
        },
        {
          id: "q_layanan",
          type: "single",
          label: "Layanan mana yang paling sering kamu pakai?",
          required: true,
          options: ["Helpdesk IT", "Administrasi HRD", "Keuangan & Reimburse", "Umum & Fasilitas"],
        },
        {
          id: "q_perbaikan",
          type: "multiple",
          label: "Apa yang perlu ditingkatkan?",
          help: "Boleh pilih lebih dari satu.",
          required: false,
          options: ["Kecepatan respon", "Keramahan", "Kejelasan informasi", "Sistem digital"],
        },
        {
          id: "q_saran",
          type: "long",
          label: "Ada saran atau cerita yang mau kamu bagikan?",
          required: false,
        },
      ],
    },
    {
      id: "frm_gathering",
      code: "GATHER26",
      title: "Pendataan Family Gathering Kanwil",
      description: "Yuk daftar family gathering akhir tahun! Data ini untuk konsumsi & transport.",
      emoji: "🏝️",
      active: true,
      createdAt: at(8),
      updatedAt: at(8),
      questions: [
        { id: "q_ikut", type: "single", label: "Kamu ikut?", required: true, options: ["Ikut dong!", "Belum bisa"] },
        { id: "q_jumlah", type: "number", label: "Jumlah anggota keluarga yang ikut", required: true },
        {
          id: "q_ukuran",
          type: "dropdown",
          label: "Ukuran kaos panitia",
          required: true,
          options: ["S", "M", "L", "XL", "XXL"],
        },
        { id: "q_alergi", type: "short", label: "Ada alergi makanan?", required: false },
      ],
    },
    {
      id: "frm_ide",
      code: "IDE2026",
      title: "Kotak Ide & Inovasi",
      description: "Punya ide yang bikin kerja makin gampang? Tulis di sini, siapa tahu jadi program Kanwil!",
      emoji: "💡",
      active: true,
      createdAt: at(20),
      updatedAt: at(20),
      questions: [
        { id: "q_judul", type: "short", label: "Judul idemu", required: true },
        { id: "q_detail", type: "long", label: "Ceritakan idenya", required: true },
        {
          id: "q_kategori",
          type: "single",
          label: "Kategori",
          required: true,
          options: ["Proses kerja", "Layanan nasabah", "Teknologi", "Budaya kerja"],
        },
        { id: "q_target", type: "date", label: "Kapan ide ini bisa mulai dicoba?", required: false },
      ],
    },
    {
      id: "frm_k3",
      code: "K3Q3",
      title: "Checklist K3 Triwulan III",
      description: "Pemeriksaan keselamatan & kesehatan kerja. Periode sudah ditutup.",
      emoji: "🦺",
      active: false,
      createdAt: at(50),
      updatedAt: at(35),
      questions: [
        { id: "q_apar", type: "single", label: "APAR di ruanganmu dalam kondisi baik?", required: true, options: ["Ya", "Tidak"] },
      ],
    },
  ];

  const layanan = ["Helpdesk IT", "Administrasi HRD", "Keuangan & Reimburse", "Umum & Fasilitas"];
  const perbaikan = ["Kecepatan respon", "Keramahan", "Kejelasan informasi", "Sistem digital"];
  const saran = [
    "Helpdesk sudah cepat, mantap!",
    "Semoga reimburse bisa lebih cepat cair.",
    "Info lewat grup kadang tenggelam, mungkin perlu kanal khusus.",
    "",
    "Terima kasih tim umum, AC sudah dingin lagi 😄",
  ];
  const responders = ["usr_rizky", "usr_sinta", "usr_andre", "usr_dewi", "usr_bayu", "usr_joko", "usr_maya"];
  const responses: FormResponse[] = responders.map((userId, i) => ({
    id: `rsp_survei_${i}`,
    formId: "frm_survei",
    userId,
    submittedAt: at(i % 7, 8 + i),
    answers: {
      q_rating: [5, 4, 4, 3, 5, 4, 2][i],
      q_layanan: layanan[i % layanan.length],
      q_perbaikan: [perbaikan[i % 4], perbaikan[(i + 2) % 4]],
      q_saran: saran[i % saran.length] || undefined,
    },
  }));

  ["usr_rizky", "usr_maya", "usr_udin", "usr_nadia", "usr_febi"].forEach((userId, i) => {
    responses.push({
      id: `rsp_gather_${i}`,
      formId: "frm_gathering",
      userId,
      submittedAt: at(i, 10 + i),
      answers: {
        q_ikut: i === 2 ? "Belum bisa" : "Ikut dong!",
        q_jumlah: i === 2 ? 0 : [3, 2, 0, 4, 2][i],
        q_ukuran: ["L", "M", "XL", "S", "M"][i],
        q_alergi: i === 1 ? "Udang" : undefined,
      },
    });
  });

  responses.push(
    {
      id: "rsp_ide_0",
      formId: "frm_ide",
      userId: "usr_andre",
      submittedAt: at(3, 14),
      answers: {
        q_judul: "Antrian digital di loket",
        q_detail: "Nasabah ambil nomor antrian lewat WhatsApp supaya tidak menumpuk di depan.",
        q_kategori: "Layanan nasabah",
      },
    },
    {
      id: "rsp_ide_1",
      formId: "frm_ide",
      userId: "usr_dewi",
      submittedAt: at(1, 11),
      answers: {
        q_judul: "Jumat sharing 15 menit",
        q_detail: "Setiap Jumat satu unit berbagi tips kerja singkat.",
        q_kategori: "Budaya kerja",
      },
    },
  );

  return { version: 1, users, units: [...DEFAULT_UNITS], forms, responses };
}

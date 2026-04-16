export const motivations: string[] = [
  "Hari yang produktif dimulai dari niat yang kuat. Semangat! 🔥",
  "Setiap baris kode adalah satu langkah lebih dekat ke versi terbaik produk kita. 💻",
  "Keep pushing boundaries — kamu lebih kuat dari yang kamu kira. 💪",
  "Bug di hari ini adalah pelajaran untuk hari esok. 🐛➡️🦋",
  "Kolaborasi > Kompetisi. Together we build better. 🤝",
  "Small progress is still progress. Jangan remehkan langkah kecil. 🪜",
  "Deadline bukan musuh — dia alarm yang jaga kita tetap fokus. ⏰",
  "Coffee loaded. Code ready. Let's ship it! ☕🚀",
  "Clean code, clear mind. Mulai hari dengan rapi. ✨",
  "1% better every day = 37x better in a year. Konsisten aja. 📈",
  "Jangan lupa stretch & minum air. Tubuh sehat, pikiran tajam. 🧘‍♂️",
  "Kamu dipilih di tim ini karena kamu hebat. Own it! ⭐",
  "Ship it, iterate, improve. Perfection is the enemy of progress. 🛳️",
  "Yang penting bukan seberapa cepat, tapi seberapa konsisten. 🎯",
  "Great teams are built on trust, transparency, and good vibes. 🌟",
  "Setiap fitur yang kamu bangun impact ke user nyata. That matters. 🙌",
  "Work hard, but don't forget to enjoy the journey. 🎢",
  "Be the developer you needed when you were a junior. 🧑‍🏫",
  "Gagal itu wajar. Yang penting bangkit dan coba lagi. 🔄",
  "Innovation happens when we dare to think differently. 💡",
  "Documentation is love letter to your future self. 📝",
  "Hari ini satu langkah, besok satu lompatan. Keep going! 🦘",
  "Good communication saves more time than good code. 💬",
  "Celebrate small wins — they fuel the big ones. 🎉",
  "Focus mode: ON. Distraction mode: OFF. Let's go! 🎧",
  "Kode yang baik dibaca oleh manusia, dijalankan oleh mesin. 📖",
  "Don't compare your chapter 1 to someone else's chapter 20. 📚",
  "REST API or RESTing? Either way, take care of yourself. 😄",
  "Today's commit is tomorrow's feature. Push with confidence! 🚀",
  "Remember: kamu bagian dari sesuatu yang lebih besar. Proud of you! 🏆",
];

export function getDailyMotivation(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return motivations[dayOfYear % motivations.length];
}

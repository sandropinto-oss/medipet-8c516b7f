export const tutor = {
  name: "Mariana Costa",
  initials: "MC",
  city: "São Paulo, SP",
};

export const pet = {
  name: "Theo",
  species: "Cão",
  breed: "Labrador",
  age: "6 anos",
  weight: "32 kg",
  condition: "Insulinoma",
  allergies: ["Frango", "Corantes artificiais"],
  restrictions: ["Dieta low-carb", "Sem exercícios intensos"],
};

export const activeStay = {
  specialist: "Dra. Ana Paula Ribeiro",
  specialistInitials: "AP",
  condition: "Insulinoma",
  dayCurrent: 3,
  dayTotal: 5,
  checkOut: "Sex, 14 jun · 16h",
};

export const caregivers = [
  {
    id: 1,
    name: "Dra. Ana Paula Ribeiro",
    initials: "AP",
    rating: 4.9,
    reviews: 127,
    distanceKm: 1.2,
    pricePerDay: 180,
    specialties: ["Endocrinologia", "Geriatria"],
    badge: "CRMV-SP",
  },
  {
    id: 2,
    name: "Dr. Rafael Mendes",
    initials: "RM",
    rating: 4.8,
    reviews: 94,
    distanceKm: 2.7,
    pricePerDay: 150,
    specialties: ["Cardiologia", "Nefrologia"],
    badge: "CRMV-SP",
  },
  {
    id: 3,
    name: "Juliana Faria",
    initials: "JF",
    rating: 4.7,
    reviews: 58,
    distanceKm: 3.4,
    pricePerDay: 120,
    specialties: ["Diabetes", "Pós-operatório"],
    badge: "Estudante · USP",
  },
  {
    id: 4,
    name: "Dr. Lucas Pereira",
    initials: "LP",
    rating: 5.0,
    reviews: 41,
    distanceKm: 4.1,
    pricePerDay: 210,
    specialties: ["Oncologia", "UTI"],
    badge: "CRMV-SP",
  },
];

export const medications = [
  { time: "06:00", name: "Diazóxido", dose: "50 mg", done: true },
  { time: "08:00", name: "Café reforçado", dose: "150 g", done: true },
  { time: "12:00", name: "Prednisolona", dose: "5 mg", done: true },
  { time: "14:00", name: "Glicemia capilar", dose: "Aferição", done: false },
  { time: "18:00", name: "Diazóxido", dose: "50 mg", done: false },
  { time: "22:00", name: "Octreotide", dose: "20 mcg", done: false },
];

export const glucoseData = [
  { time: "08h", value: 62 },
  { time: "09h", value: 78 },
  { time: "10h", value: 95 },
  { time: "11h", value: 88 },
  { time: "12h", value: 110 },
  { time: "13h", value: 92 },
];

export const heartRateData = [
  { time: "08h", value: 88 },
  { time: "09h", value: 92 },
  { time: "10h", value: 96 },
  { time: "11h", value: 90 },
  { time: "12h", value: 102 },
  { time: "13h", value: 94 },
];

export const messages = [
  {
    id: 1,
    name: "Dra. Ana Paula",
    initials: "AP",
    preview: "Theo se alimentou bem e a glicemia está estável.",
    time: "12:42",
    unread: 2,
  },
  {
    id: 2,
    name: "Suporte MediPet",
    initials: "MP",
    preview: "Sua reserva foi confirmada para sex, 14/06.",
    time: "Ontem",
    unread: 0,
  },
  {
    id: 3,
    name: "Dr. Rafael Mendes",
    initials: "RM",
    preview: "Posso te ajudar com o protocolo cardíaco do Theo.",
    time: "Seg",
    unread: 0,
  },
];

export const history = [
  {
    id: 1,
    title: "Hospedagem · Insulinoma",
    specialist: "Dra. Ana Paula",
    date: "10–15 jun 2026",
    status: "Em andamento",
  },
  {
    id: 2,
    title: "Pós-operatório · Castração",
    specialist: "Dr. Lucas Pereira",
    date: "22–25 mar 2026",
    status: "Concluído",
  },
  {
    id: 3,
    title: "Monitoramento · Cardiopatia",
    specialist: "Dr. Rafael Mendes",
    date: "08–11 jan 2026",
    status: "Concluído",
  },
];

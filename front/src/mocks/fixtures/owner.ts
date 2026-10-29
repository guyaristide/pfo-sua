import type { OwnerDocumentGroup, OwnerLot, OwnerProfile, OwnerReport } from '@/services/contracts';

/**
 * Espace propriétaire du prototype 3 d'Elodie : l'actif ITC (SCI ITC, quatre comptes-rendus validés) et un
 * nouvel actif sans compte-rendu (SCI Les Flamboyants). Montants en francs CFA, sans unité.
 */
export interface OwnerSeed {
  profile: OwnerProfile;
  buildings: { key: string; name: string; lots: number }[];
  lots: OwnerLot[];
  upcoming: { date: string; title: string; detail: string }[];
  riskCount: number;
  documents: OwnerDocumentGroup[];
  reports: OwnerReport[];
}

export const ownerSeeds: Record<'itc' | 'flamboyants', OwnerSeed> = {
  itc: {
    profile: {
      personName: "Jean-Marc Aka",
      email: "jm.aka@sci-itc.ci",
      sciName: "SCI ITC",
      assetName: "ITC",
      assetDescription: "Ivoire Trade Center · Plateau · 4 bâtiments · 86 lots",
      contacts: [
        {
          name: "Eléma",
          role: "Gestionnaire de patrimoine",
          phone: "+225 07 08 41 22 63",
          email: "m.ndri@pfo-immobilier.ci"
        },
        {
          name: "Vincent",
          role: "Gestionnaire financier",
          phone: "+225 05 76 30 18 94",
          email: "a.kouassi@pfo-immobilier.ci"
        }
      ],
      payoutAccount: "compte SGCI CI93 CI00 8010 … 1234",
      firstReportExpected: null
    },
    buildings: [
      {
        key: "A",
        name: "Bâtiment A",
        lots: 22
      },
      {
        key: "B",
        name: "Bâtiment B",
        lots: 24
      },
      {
        key: "C",
        name: "Bâtiment C",
        lots: 22
      },
      {
        key: "D",
        name: "Bâtiment D",
        lots: 18
      }
    ],
    lots: [
      {
        code: "A-001",
        type: "Commerces",
        area: 60,
        building: "A",
        tenantName: "Restaurant Nzi",
        since: "2025-10-01",
        quarterlyRent: 2150000,
        status: "occupied"
      },
      {
        code: "A-002",
        type: "Commerces",
        area: 96,
        building: "A",
        tenantName: "Restaurant Bandama",
        since: "2022-07-01",
        quarterlyRent: 3450000,
        status: "occupied"
      },
      {
        code: "A-003",
        type: "Commerces",
        area: 96,
        building: "A",
        tenantName: "Boutique Bia",
        since: "2020-10-01",
        quarterlyRent: 3450000,
        status: "occupied"
      },
      {
        code: "A-004",
        type: "Commerces",
        area: 60,
        building: "A",
        tenantName: "Pressing Akwaba",
        since: "2021-07-01",
        quarterlyRent: 2150000,
        status: "occupied"
      },
      {
        code: "A-005",
        type: "Commerces",
        area: 96,
        building: "A",
        tenantName: "Restaurant Ébène",
        since: "2021-01-01",
        quarterlyRent: 3450000,
        status: "occupied"
      },
      {
        code: "A-006",
        type: "Commerces",
        area: 80,
        building: "A",
        tenantName: "Salon Sassandra",
        since: "2023-07-01",
        quarterlyRent: 2900000,
        status: "occupied"
      },
      {
        code: "A-007",
        type: "Commerces",
        area: 60,
        building: "A",
        tenantName: null,
        since: "2026-07-01",
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "A-008",
        type: "Commerces",
        area: 72,
        building: "A",
        tenantName: "Librairie Sankofa",
        since: "2019-10-01",
        quarterlyRent: 2600000,
        status: "occupied"
      },
      {
        code: "A-009",
        type: "Commerces",
        area: 60,
        building: "A",
        tenantName: "Salon Zanzan",
        since: "2024-01-01",
        quarterlyRent: 2150000,
        status: "occupied"
      },
      {
        code: "A-010",
        type: "Commerces",
        area: 96,
        building: "A",
        tenantName: "Optique Agnéby",
        since: "2019-01-01",
        quarterlyRent: 3450000,
        status: "occupied"
      },
      {
        code: "A-011",
        type: "Commerces",
        area: 48,
        building: "A",
        tenantName: "Salon Lagune",
        since: "2021-07-01",
        quarterlyRent: 1750000,
        status: "occupied"
      },
      {
        code: "A-012",
        type: "Commerces",
        area: 72,
        building: "A",
        tenantName: "Pharmacie Les Cocotiers",
        since: "2020-03-01",
        quarterlyRent: 2900000,
        status: "occupied"
      },
      {
        code: "A-013",
        type: "Commerces",
        area: 48,
        building: "A",
        tenantName: "Librairie Bia",
        since: "2024-03-01",
        quarterlyRent: 1750000,
        status: "occupied"
      },
      {
        code: "A-014",
        type: "Commerces",
        area: 48,
        building: "A",
        tenantName: "Pressing Marahoué",
        since: "2023-04-01",
        quarterlyRent: 1750000,
        status: "occupied"
      },
      {
        code: "A-015",
        type: "Commerces",
        area: 120,
        building: "A",
        tenantName: "Restaurant Sankofa",
        since: "2020-03-01",
        quarterlyRent: 4300000,
        status: "occupied"
      },
      {
        code: "A-016",
        type: "Commerces",
        area: 60,
        building: "A",
        tenantName: "Pressing Cavally",
        since: "2025-10-01",
        quarterlyRent: 2150000,
        status: "occupied"
      },
      {
        code: "A-017",
        type: "Commerces",
        area: 48,
        building: "A",
        tenantName: "Salon Baobab",
        since: "2023-10-01",
        quarterlyRent: 1750000,
        status: "occupied"
      },
      {
        code: "A-018",
        type: "Commerces",
        area: 80,
        building: "A",
        tenantName: "Maquis Bia",
        since: "2022-01-01",
        quarterlyRent: 2900000,
        status: "occupied"
      },
      {
        code: "A-019",
        type: "Commerces",
        area: 60,
        building: "A",
        tenantName: null,
        since: "2026-09-30",
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "A-020",
        type: "Commerces",
        area: 48,
        building: "A",
        tenantName: "Restaurant Comoé",
        since: "2019-01-01",
        quarterlyRent: 1750000,
        status: "occupied"
      },
      {
        code: "A-021",
        type: "Commerces",
        area: 60,
        building: "A",
        tenantName: "Restaurant Agnéby",
        since: "2022-01-01",
        quarterlyRent: 2150000,
        status: "occupied"
      },
      {
        code: "A-022",
        type: "Commerces",
        area: 80,
        building: "A",
        tenantName: "Salon Cavally",
        since: "2020-01-01",
        quarterlyRent: 2900000,
        status: "occupied"
      },
      {
        code: "B-101",
        type: "Bureaux",
        area: 300,
        building: "B",
        tenantName: "Nzi Pharma SARL",
        since: "2020-10-01",
        quarterlyRent: 9000000,
        status: "occupied"
      },
      {
        code: "B-102",
        type: "Bureaux",
        area: 186,
        building: "B",
        tenantName: "Bandama Audit SA",
        since: "2020-04-01",
        quarterlyRent: 5600000,
        status: "occupied"
      },
      {
        code: "B-103",
        type: "Bureaux",
        area: 160,
        building: "B",
        tenantName: "Nzi Conseil SARL",
        since: "2023-07-01",
        quarterlyRent: 4800000,
        status: "occupied"
      },
      {
        code: "B-104",
        type: "Bureaux",
        area: 186,
        building: "B",
        tenantName: "Nzi Distribution SA",
        since: "2022-04-01",
        quarterlyRent: 5600000,
        status: "occupied"
      },
      {
        code: "B-105",
        type: "Bureaux",
        area: 120,
        building: "B",
        tenantName: "Lagune Formation SAS",
        since: "2020-07-01",
        quarterlyRent: 3600000,
        status: "occupied"
      },
      {
        code: "B-106",
        type: "Bureaux",
        area: 120,
        building: "B",
        tenantName: "Marahoué Audit SARL",
        since: "2022-03-01",
        quarterlyRent: 3600000,
        status: "occupied"
      },
      {
        code: "B-107",
        type: "Bureaux",
        area: 240,
        building: "B",
        tenantName: "Lagune Pharma",
        since: "2020-03-01",
        quarterlyRent: 7200000,
        status: "occupied"
      },
      {
        code: "B-108",
        type: "Bureaux",
        area: 142,
        building: "B",
        tenantName: null,
        since: "2026-04-01",
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "B-109",
        type: "Bureaux",
        area: 142,
        building: "B",
        tenantName: "Comoé Conseil SAS",
        since: "2022-03-01",
        quarterlyRent: 4250000,
        status: "occupied"
      },
      {
        code: "B-110",
        type: "Bureaux",
        area: 160,
        building: "B",
        tenantName: "Marahoué Pharma SARL",
        since: "2021-10-01",
        quarterlyRent: 4800000,
        status: "occupied"
      },
      {
        code: "B-111",
        type: "Bureaux",
        area: 210,
        building: "B",
        tenantName: "Lagune Énergie SA",
        since: "2023-03-01",
        quarterlyRent: 6300000,
        status: "occupied"
      },
      {
        code: "B-112",
        type: "Bureaux",
        area: 96,
        building: "B",
        tenantName: "Ébène Audit",
        since: "2023-01-01",
        quarterlyRent: 2900000,
        status: "occupied"
      },
      {
        code: "B-113",
        type: "Bureaux",
        area: 120,
        building: "B",
        tenantName: "Akwaba Énergie SARL",
        since: "2021-01-01",
        quarterlyRent: 3600000,
        status: "occupied"
      },
      {
        code: "B-114",
        type: "Bureaux",
        area: 120,
        building: "B",
        tenantName: "Tiassalé Formation SA",
        since: "2024-04-01",
        quarterlyRent: 3600000,
        status: "occupied"
      },
      {
        code: "B-115",
        type: "Bureaux",
        area: 186,
        building: "B",
        tenantName: "Groupe Savane",
        since: "2024-07-01",
        quarterlyRent: 3000000,
        status: "occupied"
      },
      {
        code: "B-116",
        type: "Bureaux",
        area: 240,
        building: "B",
        tenantName: "Marahoué Distribution SA",
        since: "2019-03-01",
        quarterlyRent: 7200000,
        status: "occupied"
      },
      {
        code: "B-301",
        type: "Bureaux",
        area: 186,
        building: "B",
        tenantName: "Tiassalé Avocats SARL",
        since: "2021-03-01",
        quarterlyRent: 5600000,
        status: "occupied"
      },
      {
        code: "B-302",
        type: "Bureaux",
        area: 240,
        building: "B",
        tenantName: "Cabinet Yao",
        since: "2021-10-01",
        quarterlyRent: 1400000,
        status: "occupied"
      },
      {
        code: "B-303",
        type: "Bureaux",
        area: 240,
        building: "B",
        tenantName: "Zanzan Distribution SAS",
        since: "2020-04-01",
        quarterlyRent: 7200000,
        status: "occupied"
      },
      {
        code: "B-304",
        type: "Bureaux",
        area: 96,
        building: "B",
        tenantName: "Sassandra Distribution SARL",
        since: "2022-04-01",
        quarterlyRent: 2900000,
        status: "occupied"
      },
      {
        code: "B-305",
        type: "Bureaux",
        area: 160,
        building: "B",
        tenantName: "Cavally Pharma",
        since: "2019-03-01",
        quarterlyRent: 4800000,
        status: "occupied"
      },
      {
        code: "B-306",
        type: "Bureaux",
        area: 186,
        building: "B",
        tenantName: null,
        since: "2026-01-01",
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "B-307",
        type: "Bureaux",
        area: 210,
        building: "B",
        tenantName: "Cavally Conseil SARL",
        since: "2022-01-01",
        quarterlyRent: 6300000,
        status: "occupied"
      },
      {
        code: "B-308",
        type: "Bureaux",
        area: 186,
        building: "B",
        tenantName: "Tiassalé Conseil SAS",
        since: "2025-01-01",
        quarterlyRent: 5600000,
        status: "occupied"
      },
      {
        code: "C-301",
        type: "Bureaux",
        area: 240,
        building: "C",
        tenantName: "Cavally Assurances SA",
        since: "2019-03-01",
        quarterlyRent: 7200000,
        status: "occupied"
      },
      {
        code: "C-302",
        type: "Bureaux",
        area: 160,
        building: "C",
        tenantName: "Sankofa Voyages SAS",
        since: "2021-07-01",
        quarterlyRent: 4800000,
        status: "occupied"
      },
      {
        code: "C-303",
        type: "Bureaux",
        area: 96,
        building: "C",
        tenantName: "Comoé Formation SA",
        since: "2024-10-01",
        quarterlyRent: 2900000,
        status: "occupied"
      },
      {
        code: "C-304",
        type: "Bureaux",
        area: 300,
        building: "C",
        tenantName: "Comoé Avocats SAS",
        since: "2023-04-01",
        quarterlyRent: 9000000,
        status: "occupied"
      },
      {
        code: "C-305",
        type: "Bureaux",
        area: 160,
        building: "C",
        tenantName: "Lagune Distribution SAS",
        since: "2019-03-01",
        quarterlyRent: 4800000,
        status: "occupied"
      },
      {
        code: "C-306",
        type: "Bureaux",
        area: 240,
        building: "C",
        tenantName: "Sassandra Avocats SAS",
        since: "2025-10-01",
        quarterlyRent: 7200000,
        status: "occupied"
      },
      {
        code: "C-307",
        type: "Bureaux",
        area: 96,
        building: "C",
        tenantName: "Cavally Médias SAS",
        since: "2022-01-01",
        quarterlyRent: 2900000,
        status: "occupied"
      },
      {
        code: "C-308",
        type: "Bureaux",
        area: 210,
        building: "C",
        tenantName: "Lagune Audit",
        since: "2021-03-01",
        quarterlyRent: 6300000,
        status: "occupied"
      },
      {
        code: "C-309",
        type: "Bureaux",
        area: 120,
        building: "C",
        tenantName: "Kanaga Pharma",
        since: "2020-10-01",
        quarterlyRent: 3600000,
        status: "occupied"
      },
      {
        code: "C-310",
        type: "Bureaux",
        area: 96,
        building: "C",
        tenantName: "Ivoire Data Services",
        since: "2022-01-01",
        quarterlyRent: 26000000,
        status: "occupied"
      },
      {
        code: "C-311",
        type: "Bureaux",
        area: 160,
        building: "C",
        tenantName: "Agnéby Pharma SAS",
        since: "2025-04-01",
        quarterlyRent: 4800000,
        status: "occupied"
      },
      {
        code: "C-312",
        type: "Bureaux",
        area: 142,
        building: "C",
        tenantName: "Lagune Avocats SARL",
        since: "2023-10-01",
        quarterlyRent: 4250000,
        status: "occupied"
      },
      {
        code: "C-313",
        type: "Bureaux",
        area: 96,
        building: "C",
        tenantName: "Ébène Conseil SA",
        since: "2022-07-01",
        quarterlyRent: 2900000,
        status: "occupied"
      },
      {
        code: "C-314",
        type: "Bureaux",
        area: 300,
        building: "C",
        tenantName: "Kanaga Distribution",
        since: "2024-10-01",
        quarterlyRent: 9000000,
        status: "occupied"
      },
      {
        code: "C-315",
        type: "Bureaux",
        area: 186,
        building: "C",
        tenantName: null,
        since: "2026-08-01",
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "C-316",
        type: "Bureaux",
        area: 160,
        building: "C",
        tenantName: "Sassandra Assurances SA",
        since: "2019-07-01",
        quarterlyRent: 4800000,
        status: "occupied"
      },
      {
        code: "C-317",
        type: "Bureaux",
        area: 120,
        building: "C",
        tenantName: "Baobab Conseil",
        since: "2024-04-01",
        quarterlyRent: 3600000,
        status: "occupied"
      },
      {
        code: "C-318",
        type: "Bureaux",
        area: 96,
        building: "C",
        tenantName: "Sassandra Informatique",
        since: "2024-07-01",
        quarterlyRent: 2900000,
        status: "occupied"
      },
      {
        code: "C-319",
        type: "Bureaux",
        area: 300,
        building: "C",
        tenantName: "Agnéby Conseil SAS",
        since: "2021-01-01",
        quarterlyRent: 9000000,
        status: "occupied"
      },
      {
        code: "C-320",
        type: "Bureaux",
        area: 300,
        building: "C",
        tenantName: "Kanaga Distribution SA",
        since: "2020-03-01",
        quarterlyRent: 9000000,
        status: "occupied"
      },
      {
        code: "C-321",
        type: "Bureaux",
        area: 186,
        building: "C",
        tenantName: null,
        since: "2025-05-01",
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "C-322",
        type: "Bureaux",
        area: 120,
        building: "C",
        tenantName: "Lagune Ingénierie SARL",
        since: "2022-07-01",
        quarterlyRent: 3600000,
        status: "occupied"
      },
      {
        code: "D-101",
        type: "Entrepôts",
        area: 1200,
        building: "D",
        tenantName: "Marahoué Médias",
        since: "2024-03-01",
        quarterlyRent: 7200000,
        status: "occupied"
      },
      {
        code: "D-102",
        type: "Entrepôts",
        area: 800,
        building: "D",
        tenantName: "Bia Télécom SA",
        since: "2025-04-01",
        quarterlyRent: 4800000,
        status: "occupied"
      },
      {
        code: "D-103",
        type: "Entrepôts",
        area: 800,
        building: "D",
        tenantName: "Bia Distribution SAS",
        since: "2019-07-01",
        quarterlyRent: 4800000,
        status: "occupied"
      },
      {
        code: "D-104",
        type: "Entrepôts",
        area: 400,
        building: "D",
        tenantName: "Baobab Avocats SAS",
        since: "2019-04-01",
        quarterlyRent: 2400000,
        status: "occupied"
      },
      {
        code: "D-105",
        type: "Entrepôts",
        area: 800,
        building: "D",
        tenantName: "Afrik Logistique",
        since: "2023-04-01",
        quarterlyRent: 2800000,
        status: "occupied"
      },
      {
        code: "D-106",
        type: "Entrepôts",
        area: 1200,
        building: "D",
        tenantName: "Ébène Agro",
        since: "2024-01-01",
        quarterlyRent: 7200000,
        status: "occupied"
      },
      {
        code: "D-107",
        type: "Entrepôts",
        area: 800,
        building: "D",
        tenantName: "Sankofa Formation",
        since: "2023-03-01",
        quarterlyRent: 4800000,
        status: "occupied"
      },
      {
        code: "D-108",
        type: "Entrepôts",
        area: 800,
        building: "D",
        tenantName: "Sassandra Formation",
        since: "2022-03-01",
        quarterlyRent: 4800000,
        status: "occupied"
      },
      {
        code: "D-109",
        type: "Entrepôts",
        area: 600,
        building: "D",
        tenantName: "Bandama Énergie SAS",
        since: "2023-07-01",
        quarterlyRent: 3600000,
        status: "occupied"
      },
      {
        code: "D-110",
        type: "Entrepôts",
        area: 600,
        building: "D",
        tenantName: "Sankofa Audit SARL",
        since: "2020-01-01",
        quarterlyRent: 3600000,
        status: "occupied"
      },
      {
        code: "D-111",
        type: "Entrepôts",
        area: 800,
        building: "D",
        tenantName: "Bia Agro SA",
        since: "2019-07-01",
        quarterlyRent: 4800000,
        status: "occupied"
      },
      {
        code: "D-112",
        type: "Entrepôts",
        area: 800,
        building: "D",
        tenantName: null,
        since: "2026-09-01",
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "D-113",
        type: "Entrepôts",
        area: 800,
        building: "D",
        tenantName: "Bandama Architecture",
        since: "2019-04-01",
        quarterlyRent: 4800000,
        status: "occupied"
      },
      {
        code: "D-114",
        type: "Entrepôts",
        area: 800,
        building: "D",
        tenantName: "Agnéby Formation SARL",
        since: "2019-07-01",
        quarterlyRent: 4800000,
        status: "occupied"
      },
      {
        code: "D-115",
        type: "Entrepôts",
        area: 1200,
        building: "D",
        tenantName: "Bandama Pharma SA",
        since: "2025-01-01",
        quarterlyRent: 7200000,
        status: "occupied"
      },
      {
        code: "D-116",
        type: "Entrepôts",
        area: 1200,
        building: "D",
        tenantName: "Bandama Assurances SAS",
        since: "2019-03-01",
        quarterlyRent: 7200000,
        status: "occupied"
      },
      {
        code: "D-117",
        type: "Entrepôts",
        area: 800,
        building: "D",
        tenantName: "Akwaba Distribution SAS",
        since: "2024-01-01",
        quarterlyRent: 4800000,
        status: "occupied"
      },
      {
        code: "D-118",
        type: "Entrepôts",
        area: 800,
        building: "D",
        tenantName: "Sassandra Énergie SAS",
        since: "2019-10-01",
        quarterlyRent: 4800000,
        status: "occupied"
      }
    ],
    upcoming: [
      {
        date: "2026-10-20",
        title: "Reversement du T3 2026",
        detail: "387 881 920 sur le compte SGCI CI93 … 1234"
      },
      {
        date: "2026-12-31",
        title: "Fin de bail · lot C-312",
        detail: "Renouvellement proposé au locataire"
      },
      {
        date: "2027-01-01",
        title: "Révision annuelle des loyers",
        detail: "31 baux concernés, +3 % en moyenne"
      },
      {
        date: "2027-01-15",
        title: "Compte-rendu du T4 2026",
        detail: "Publié ici après validation et signature"
      },
      {
        date: "2027-01-31",
        title: "Budget des charges 2027",
        detail: "Projet envoyé pour votre approbation"
      }
    ],
    riskCount: 2,
    documents: [
      {
        label: "Comptes-rendus de gestion",
        documents: [
          {
            id: "crg-itc-2026-3",
            name: "Compte-rendu T3 2026",
            detail: "Signé le 14.10.2026 · avec la balance des tiers et le budget",
            fileName: "CRG ITC 3T26.pdf"
          },
          {
            id: "crg-itc-2026-2",
            name: "Compte-rendu T2 2026",
            detail: "Signé le 15.07.2026 · avec la balance des tiers et le budget",
            fileName: "CRG ITC 2T26.pdf"
          },
          {
            id: "crg-itc-2026-1",
            name: "Compte-rendu T1 2026",
            detail: "Signé le 15.04.2026 · avec la balance des tiers et le budget",
            fileName: "CRG ITC 1T26.pdf"
          },
          {
            id: "crg-itc-2025-4",
            name: "Compte-rendu T4 2025",
            detail: "Signé le 15.01.2026 · avec la balance des tiers et le budget",
            fileName: "CRG ITC 4T25.pdf"
          }
        ]
      },
      {
        label: "Fiscalité",
        documents: [
          {
            id: "doc-itc-1-0",
            name: "Relevé annuel des revenus fonciers 2025",
            detail: "Pour la déclaration de la SCI · publié le 31.01.2026",
            fileName: "Releve revenus ITC 2025.pdf"
          }
        ]
      },
      {
        label: "Budget des charges",
        documents: [
          {
            id: "doc-itc-2-0",
            name: "Budget 2026 recalé à mi-année",
            detail: "Signé le 15.07.2026 · 242 000 000",
            fileName: "Budget ITC 2026 recale.pdf"
          },
          {
            id: "doc-itc-2-1",
            name: "Budget 2026 initial",
            detail: "Approuvé le 28.01.2026 · 248 000 000",
            fileName: "Budget ITC 2026.pdf"
          }
        ]
      },
      {
        label: "Mandat",
        documents: [
          {
            id: "doc-itc-3-0",
            name: "Mandat de gestion · SCI ITC",
            detail: "Signé le 12.12.2008 · effet au 01.01.2009 · honoraires 8 %",
            fileName: "Mandat ITC.pdf"
          }
        ]
      }
    ],
    reports: [
      {
        id: "crg-itc-2026-3",
        quarter: 3,
        year: 2026,
        periodStart: "2026-07-01",
        periodEnd: "2026-09-30",
        signedOn: "2026-10-14",
        invoiced: 516300000,
        collected: 486350000,
        unpaid: 28450000,
        payout: 387881920,
        unpaidDetail: "7 locataires, dont 2 depuis plus de 90 jours",
        byItem: [
          {
            label: "Loyers",
            amount: 398200000
          },
          {
            label: "Charges locatives",
            amount: 61900000
          },
          {
            label: "Enseignes",
            amount: 9450000
          },
          {
            label: "Revenus complémentaires",
            amount: 16800000
          }
        ],
        byType: [
          {
            label: "Bureaux",
            amount: 291800000
          },
          {
            label: "Commerces",
            amount: 79300000
          },
          {
            label: "Entrepôts",
            amount: 115250000
          }
        ],
        aging: [
          {
            bucket: "under-30",
            amount: 18400000,
            tenantCount: 3
          },
          {
            bucket: "30-90",
            amount: 5250000,
            tenantCount: 2
          },
          {
            bucket: "over-90",
            amount: 4800000,
            tenantCount: 2
          }
        ],
        adjustments: "Régularisations du trimestre : 1 200 000 de réduction de charges accordée à un commerce.",
        charges: [
          {
            label: "Provisions appelées",
            amount: 61900000
          },
          {
            label: "Dépenses engagées",
            amount: 58400000
          },
          {
            label: "Dont part du propriétaire sur les lots vacants",
            amount: 4300000
          }
        ],
        fees: [
          {
            label: "Base : loyers, enseignes et revenus complémentaires encaissés",
            amount: 424450000
          },
          {
            label: "Honoraires HT · 8 %",
            amount: 33956000
          },
          {
            label: "TVA · 18 %",
            amount: 6112080
          },
          {
            label: "Honoraires TTC",
            amount: 40068080
          }
        ],
        payoutLines: [
          {
            label: "Encaissements du trimestre",
            amount: 486350000
          },
          {
            label: "Charges payées pour la SCI",
            amount: -58400000
          },
          {
            label: "Honoraires TTC",
            amount: -40068080
          }
        ],
        budgetLines: [
          {
            label: "Budget initial",
            amount: 248000000
          },
          {
            label: "Budget recalé à mi-année",
            amount: 242000000
          }
        ],
        budgetRealised: 176900000,
        budgetRate: 0.73,
        signatories: [
          {
            role: "Direction administrative et financière",
            signedBy: "Signé le 14.10.2026"
          },
          {
            role: "Asset Manager",
            signedBy: "Signé le 14.10.2026"
          },
          {
            role: "Gestionnaire financier",
            signedBy: "Vincent · signé le 14.10.2026"
          },
          {
            role: "Responsable PM adjointe",
            signedBy: "Eléma · signé le 14.10.2026"
          }
        ]
      },
      {
        id: "crg-itc-2026-2",
        quarter: 2,
        year: 2026,
        periodStart: "2026-04-01",
        periodEnd: "2026-06-30",
        signedOn: "2026-07-15",
        invoiced: 509800000,
        collected: 475350000,
        unpaid: 31550000,
        payout: 377059840,
        unpaidDetail: "7 locataires, dont 2 depuis plus de 90 jours",
        byItem: [
          {
            label: "Loyers",
            amount: 391400000
          },
          {
            label: "Charges locatives",
            amount: 60200000
          },
          {
            label: "Enseignes",
            amount: 9450000
          },
          {
            label: "Revenus complémentaires",
            amount: 14300000
          }
        ],
        byType: [
          {
            label: "Bureaux",
            amount: 285200000
          },
          {
            label: "Commerces",
            amount: 77500000
          },
          {
            label: "Entrepôts",
            amount: 112650000
          }
        ],
        aging: [
          {
            bucket: "under-30",
            amount: 19800000,
            tenantCount: 3
          },
          {
            bucket: "30-90",
            amount: 6100000,
            tenantCount: 2
          },
          {
            bucket: "over-90",
            amount: 5650000,
            tenantCount: 2
          }
        ],
        adjustments: "Aucune régularisation ce trimestre.",
        charges: [
          {
            label: "Provisions appelées",
            amount: 60200000
          },
          {
            label: "Dépenses engagées",
            amount: 59100000
          },
          {
            label: "Dont part du propriétaire sur les lots vacants",
            amount: 4900000
          }
        ],
        fees: [
          {
            label: "Base : loyers, enseignes et revenus complémentaires encaissés",
            amount: 415150000
          },
          {
            label: "Honoraires HT · 8 %",
            amount: 33212000
          },
          {
            label: "TVA · 18 %",
            amount: 5978160
          },
          {
            label: "Honoraires TTC",
            amount: 39190160
          }
        ],
        payoutLines: [
          {
            label: "Encaissements du trimestre",
            amount: 475350000
          },
          {
            label: "Charges payées pour la SCI",
            amount: -59100000
          },
          {
            label: "Honoraires TTC",
            amount: -39190160
          }
        ],
        budgetLines: [
          {
            label: "Budget initial",
            amount: 248000000
          },
          {
            label: "Budget recalé à mi-année",
            amount: 248000000
          }
        ],
        budgetRealised: 118500000,
        budgetRate: 0.48,
        signatories: [
          {
            role: "Direction administrative et financière",
            signedBy: "Signé le 15.07.2026"
          },
          {
            role: "Asset Manager",
            signedBy: "Signé le 15.07.2026"
          },
          {
            role: "Gestionnaire financier",
            signedBy: "Vincent · signé le 15.07.2026"
          },
          {
            role: "Responsable PM adjointe",
            signedBy: "Eléma · signé le 15.07.2026"
          }
        ]
      },
      {
        id: "crg-itc-2026-1",
        quarter: 1,
        year: 2026,
        periodStart: "2026-01-01",
        periodEnd: "2026-03-31",
        signedOn: "2026-04-15",
        invoiced: 505200000,
        collected: 475050000,
        unpaid: 31100000,
        payout: 375650400,
        unpaidDetail: "7 locataires, dont 2 depuis plus de 90 jours",
        byItem: [
          {
            label: "Loyers",
            amount: 386900000
          },
          {
            label: "Charges locatives",
            amount: 59800000
          },
          {
            label: "Enseignes",
            amount: 9450000
          },
          {
            label: "Revenus complémentaires",
            amount: 18900000
          }
        ],
        byType: [
          {
            label: "Bureaux",
            amount: 285050000
          },
          {
            label: "Commerces",
            amount: 77450000
          },
          {
            label: "Entrepôts",
            amount: 112550000
          }
        ],
        aging: [
          {
            bucket: "under-30",
            amount: 21300000,
            tenantCount: 3
          },
          {
            bucket: "30-90",
            amount: 4700000,
            tenantCount: 2
          },
          {
            bucket: "over-90",
            amount: 5100000,
            tenantCount: 2
          }
        ],
        adjustments: "Régularisations du trimestre : geste commercial de 850 000.",
        charges: [
          {
            label: "Provisions appelées",
            amount: 59800000
          },
          {
            label: "Dépenses engagées",
            amount: 60200000
          },
          {
            label: "Dont part du propriétaire sur les lots vacants",
            amount: 5200000
          }
        ],
        fees: [
          {
            label: "Base : loyers, enseignes et revenus complémentaires encaissés",
            amount: 415250000
          },
          {
            label: "Honoraires HT · 8 %",
            amount: 33220000
          },
          {
            label: "TVA · 18 %",
            amount: 5979600
          },
          {
            label: "Honoraires TTC",
            amount: 39199600
          }
        ],
        payoutLines: [
          {
            label: "Encaissements du trimestre",
            amount: 475050000
          },
          {
            label: "Charges payées pour la SCI",
            amount: -60200000
          },
          {
            label: "Honoraires TTC",
            amount: -39199600
          }
        ],
        budgetLines: [
          {
            label: "Budget initial",
            amount: 248000000
          },
          {
            label: "Budget recalé à mi-année",
            amount: 248000000
          }
        ],
        budgetRealised: 60200000,
        budgetRate: 0.24,
        signatories: [
          {
            role: "Direction administrative et financière",
            signedBy: "Signé le 15.04.2026"
          },
          {
            role: "Asset Manager",
            signedBy: "Signé le 15.04.2026"
          },
          {
            role: "Gestionnaire financier",
            signedBy: "Vincent · signé le 15.04.2026"
          },
          {
            role: "Responsable PM adjointe",
            signedBy: "Eléma · signé le 15.04.2026"
          }
        ]
      },
      {
        id: "crg-itc-2025-4",
        quarter: 4,
        year: 2025,
        periodStart: "2025-10-01",
        periodEnd: "2025-12-31",
        signedOn: "2026-01-15",
        invoiced: 498600000,
        collected: 469150000,
        unpaid: 28800000,
        payout: 373094080,
        unpaidDetail: "7 locataires, dont 2 depuis plus de 90 jours",
        byItem: [
          {
            label: "Loyers",
            amount: 379800000
          },
          {
            label: "Charges locatives",
            amount: 58600000
          },
          {
            label: "Enseignes",
            amount: 9450000
          },
          {
            label: "Revenus complémentaires",
            amount: 21300000
          }
        ],
        byType: [
          {
            label: "Bureaux",
            amount: 281500000
          },
          {
            label: "Commerces",
            amount: 76450000
          },
          {
            label: "Entrepôts",
            amount: 111200000
          }
        ],
        aging: [
          {
            bucket: "under-30",
            amount: 17600000,
            tenantCount: 3
          },
          {
            bucket: "30-90",
            amount: 6900000,
            tenantCount: 2
          },
          {
            bucket: "over-90",
            amount: 4300000,
            tenantCount: 2
          }
        ],
        adjustments: "Aucune régularisation ce trimestre.",
        charges: [
          {
            label: "Provisions appelées",
            amount: 58600000
          },
          {
            label: "Dépenses engagées",
            amount: 57300000
          },
          {
            label: "Dont part du propriétaire sur les lots vacants",
            amount: 5600000
          }
        ],
        fees: [
          {
            label: "Base : loyers, enseignes et revenus complémentaires encaissés",
            amount: 410550000
          },
          {
            label: "Honoraires HT · 8 %",
            amount: 32844000
          },
          {
            label: "TVA · 18 %",
            amount: 5911920
          },
          {
            label: "Honoraires TTC",
            amount: 38755920
          }
        ],
        payoutLines: [
          {
            label: "Encaissements du trimestre",
            amount: 469150000
          },
          {
            label: "Charges payées pour la SCI",
            amount: -57300000
          },
          {
            label: "Honoraires TTC",
            amount: -38755920
          }
        ],
        budgetLines: [
          {
            label: "Budget initial",
            amount: 236000000
          },
          {
            label: "Budget recalé à mi-année",
            amount: 240000000
          }
        ],
        budgetRealised: 236900000,
        budgetRate: 0.99,
        signatories: [
          {
            role: "Direction administrative et financière",
            signedBy: "Signé le 15.01.2026"
          },
          {
            role: "Asset Manager",
            signedBy: "Signé le 15.01.2026"
          },
          {
            role: "Gestionnaire financier",
            signedBy: "Vincent · signé le 15.01.2026"
          },
          {
            role: "Responsable PM adjointe",
            signedBy: "Eléma · signé le 15.01.2026"
          }
        ]
      }
    ]
  },
  flamboyants: {
    profile: {
      personName: "Adjoua Brou",
      email: "a.brou@sci-flamboyants.ci",
      sciName: "SCI Les Flamboyants",
      assetName: "Les Flamboyants",
      assetDescription: "Cocody Riviera 3 · 2 bâtiments · 24 lots",
      contacts: [
        {
          name: "Eléma",
          role: "Gestionnaire de patrimoine",
          phone: "+225 07 08 41 22 63",
          email: "m.ndri@pfo-immobilier.ci"
        },
        {
          name: "Vincent",
          role: "Gestionnaire financier",
          phone: "+225 05 76 30 18 94",
          email: "a.kouassi@pfo-immobilier.ci"
        }
      ],
      payoutAccount: null,
      firstReportExpected: "2027-01-15"
    },
    buildings: [
      {
        key: "A",
        name: "Bâtiment A",
        lots: 14
      },
      {
        key: "B",
        name: "Bâtiment B",
        lots: 10
      }
    ],
    lots: [
      {
        code: "A-101",
        type: "Bureaux",
        area: 142,
        building: "A",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "A-102",
        type: "Bureaux",
        area: 138,
        building: "A",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "A-103",
        type: "Bureaux",
        area: 96,
        building: "A",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "A-104",
        type: "Bureaux",
        area: 186,
        building: "A",
        tenantName: "Kora Énergies SARL",
        since: "2027-01-15",
        quarterlyRent: 3600000,
        status: "signed"
      },
      {
        code: "A-105",
        type: "Bureaux",
        area: 92,
        building: "A",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "A-106",
        type: "Bureaux",
        area: 210,
        building: "A",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "A-114",
        type: "Bureaux",
        area: 118,
        building: "A",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "A-201",
        type: "Bureaux",
        area: 142,
        building: "A",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "A-202",
        type: "Bureaux",
        area: 138,
        building: "A",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "A-203",
        type: "Bureaux",
        area: 240,
        building: "A",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "A-204",
        type: "Bureaux",
        area: 186,
        building: "A",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "A-205",
        type: "Bureaux",
        area: 300,
        building: "A",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "A-301",
        type: "Bureaux",
        area: 420,
        building: "A",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "A-302",
        type: "Bureaux",
        area: 360,
        building: "A",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "B-101",
        type: "Commerces",
        area: 64,
        building: "B",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "B-102",
        type: "Commerces",
        area: 72,
        building: "B",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "B-103",
        type: "Commerces",
        area: 58,
        building: "B",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "B-104",
        type: "Commerces",
        area: 120,
        building: "B",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "B-105",
        type: "Commerces",
        area: 96,
        building: "B",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "B-106",
        type: "Commerces",
        area: 80,
        building: "B",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "B-107",
        type: "Commerces",
        area: 60,
        building: "B",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "B-201",
        type: "Bureaux",
        area: 210,
        building: "B",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "B-202",
        type: "Bureaux",
        area: 190,
        building: "B",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      },
      {
        code: "B-203",
        type: "Bureaux",
        area: 150,
        building: "B",
        tenantName: null,
        since: null,
        quarterlyRent: null,
        status: "vacant"
      }
    ],
    upcoming: [
      {
        date: "2026-11-01",
        title: "Début du mandat de gestion",
        detail: "PFO Immobilier gère l’actif pour 3 ans, honoraires 8 %"
      },
      {
        date: "2026-12-20",
        title: "Première facture de Kora Énergies",
        detail: "Lot A-104 · 7 295 162, dont le dépôt de garantie"
      },
      {
        date: "2027-01-15",
        title: "Entrée de Kora Énergies",
        detail: "Bail de 3 ans · 1 200 000 de loyer mensuel"
      },
      {
        date: "2027-01-15",
        title: "Premier compte-rendu",
        detail: "Celui du T4 2026, publié ici après validation"
      }
    ],
    riskCount: 0,
    documents: [
      {
        label: "Mandat",
        documents: [
          {
            id: "doc-flam-0-0",
            name: "Mandat de gestion · SCI Les Flamboyants",
            detail: "Signé le 01.10.2026 · effet au 01.11.2026 · honoraires 8 %",
            fileName: "Mandat Les Flamboyants.pdf"
          }
        ]
      },
      {
        label: "Patrimoine",
        documents: [
          {
            id: "doc-flam-1-0",
            name: "État locatif initial",
            detail: "24 lots · importé le 16.10.2026",
            fileName: "Etat locatif Les Flamboyants.pdf"
          },
          {
            id: "doc-flam-1-1",
            name: "Bail signé · Kora Énergies SARL",
            detail: "Lot A-104 · signé le 14.10.2026",
            fileName: "Bail Kora Energies.pdf"
          }
        ]
      }
    ],
    reports: []
  }
};

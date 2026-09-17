import type { Person } from "@/app/features/kids";

/** Canonical people fixtures referenced by Kids and Auth mocks. */
export const people: readonly Person[] = [
  {
    id: "parent-lucia-fernandez",
    name: "Lucía Fernández",
    email: "lucia.fernandez@example.com",
    role: "parent",
    status: "pending",
  },
  {
    id: "parent-diego-fernandez",
    name: "Diego Fernández",
    email: "diego.fernandez@example.com",
    role: "parent",
    status: "active",
  },
  {
    id: "parent-carolina-mendez",
    name: "Carolina Méndez",
    email: "carolina.mendez@example.com",
    role: "parent",
    status: "active",
  },
  {
    id: "parent-mariana-ruiz",
    name: "Mariana Ruiz",
    email: "mariana.ruiz@example.com",
    role: "parent",
    status: "active",
  },
  {
    id: "parent-federico-ruiz",
    name: "Federico Ruiz",
    email: "federico.ruiz@example.com",
    role: "parent",
    status: "pending",
  },
  {
    id: "parent-julieta-diaz",
    name: "Julieta Díaz",
    email: "julieta.diaz@example.com",
    role: "parent",
    status: "active",
  },
  {
    id: "parent-nicolas-castro",
    name: "Nicolás Castro",
    email: "nicolas.castro@example.com",
    role: "parent",
    status: "inactive",
  },
  {
    id: "parent-paula-romero",
    name: "Paula Romero",
    email: "paula.romero@example.com",
    role: "parent",
    status: "active",
  },
  {
    id: "parent-ines-vega",
    name: "Inés Vega",
    email: "ines.vega@example.com",
    role: "parent",
    status: "active",
  },
  {
    id: "person-caro-gimenez",
    name: "Caro Giménez",
    email: "caro@opendaycare.com",
    role: "personal",
    status: "active",
  },
];

export type IkeaItem = {
  id: string;
  name: string;
  description: string;
  link?: string;
  archived?: boolean;
};

export const items: IkeaItem[] = [
  {
    id: "knorrhaj",
    name: "Knorrhaj",
    description: "pot stand",
    link: "https://www.ikea.com/",
  },
  {
    id: "vinterfint_ornament_red_green_white",
    name: "Vinterfint",
    description: "tree ornament",
  },
];

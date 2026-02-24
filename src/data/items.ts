export type IkeaItem = {
  id: string;
  name: string;
  description: string;
  imageSrc: string;
  link?: string;
};

export const items: IkeaItem[] = [
  {
    id: "knorrhaj",
    name: "Knorrhaj",
    description: "pot stand",
    imageSrc: "/items/knorrhaj.jpg",
    link: "https://www.ikea.com/",
  },
  {
    id: "vinterfint_1",
    name: "Vinterfint",
    description: "tree ornament",
    imageSrc: "/items/vinterfint_1.jpg",
  },
];

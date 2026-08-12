export type Modifier = {
  id: number;
  name: string;
  priceAdjustment: number;
};

export type MenuItem = {
  id: number;
  name: string;
  price: number;
  modifiers: Modifier[];
};

export type SelectedModifier = {
  id: number;
  name: string;
  priceAdjustment: number;
};

export type CartItem = {
  cartKey: string;
  id: number;
  name: string;
  basePrice: number;
  totalItemPrice: number;
  quantity: number;
  selectedModifiers: SelectedModifier[];
};

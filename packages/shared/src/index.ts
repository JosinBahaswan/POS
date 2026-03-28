export type TenantId = string;

export type Money = number;

export type Product = {
  id: string;
  tenantId: TenantId;
  name: string;
  price: Money;
};

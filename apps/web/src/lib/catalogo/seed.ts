import { productosSeed } from "@chia/shared";

export function getProductosSeed() {
  return productosSeed;
}

export function getProductosDestacadosSeed(limit = 3) {
  return productosSeed.filter((producto) => producto.activo).slice(0, limit);
}
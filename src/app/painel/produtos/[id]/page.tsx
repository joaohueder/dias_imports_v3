"use client";

import React from "react";
import { useParams } from "next/navigation";
import NovoProdutoPage from "../novo/page";

export default function EditarProdutoPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;

  return <NovoProdutoPage productId={id} />;
}

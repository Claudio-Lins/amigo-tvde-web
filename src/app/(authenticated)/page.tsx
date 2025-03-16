"use client";

import { HomeContent } from "@/components/home/home-content";

export default function HomePage() {
	return <HomeContent />;
}

// Arquivo separado para o componente servidor
// Este componente será automaticamente um Server Component
export { HomeContent } from "@/components/home/home-content";

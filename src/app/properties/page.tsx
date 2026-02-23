import { PropertyCard } from "@/components/PropertyCard";
import { ProfitabilityCalculator } from "@/components/ProfitabilityCalculator";
import Link from "next/link";

const MOCK_PROPERTIES = [
    {
        id: "1",
        title: "The Heritage Grand",
        description: "Iconic 5-star hotel in the heart of historical district.",
        asset_type: "Hotel",
        location: "Madrid",
        price_eur: 45000000,
        cap_rate: 6.2,
        is_off_market: true,
        thumbnail_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000",
    },
    {
        id: "2",
        title: "Azure Seafront Villa",
        description: "Contemporary masterpiece with panoramic Mediterranean views.",
        asset_type: "Villa",
        location: "Miami / Marbella",
        price_eur: 12500000,
        cap_rate: 4.8,
        is_off_market: false,
        thumbnail_url: "https://images.unsplash.com/photo-1613490900233-141c5560dd75?auto=format&fit=crop&q=80&w=1000",
    }
];

export default function PropertiesPage() {
    return (
        <main className="min-h-screen bg-background selection:bg-primary/30 pb-24">

            {/* Navigation Layer */}
            <nav className="w-full z-50 p-6 flex items-center justify-between border-b border-border bg-card sticky top-0">
                <Link href="/properties" className="font-serif text-2xl tracking-widest font-medium">Aleasignature.</Link>
                <div className="flex space-x-6 text-sm font-medium">
                    <Link href="/properties" className="text-primary transition-colors">Portfolio</Link>
                    <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">Profile</Link>
                </div>
            </nav>

            {/* Hero Header */}
            <section className="pt-20 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="font-serif text-4xl md:text-5xl font-medium mb-4">Exclusividad Operativa</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl font-sans">
                        El portfolio reservado de Aleasignature. Completa tu verificación en el Perfil para desbloquear la Data Room de activos Off-Market.
                    </p>
                </div>
            </section>

            {/* Grid List */}
            <section className="px-6 mb-24">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {MOCK_PROPERTIES.map(prop => (
                            <PropertyCard key={prop.id} property={prop} userStatus="registered" />
                        ))}
                        {/* Si quisieras falsear el visual para el admin vs investor publico, cambia userStatus a 'public' temporalmente en uno para visualizar de nuevo el blur si es off market pero con rol no verificado. */}
                        <PropertyCard property={{ ...MOCK_PROPERTIES[0], id: "3", title: "Palacio Gran Vía" }} userStatus="public" />
                    </div>
                </div>
            </section>

            {/* Analytics Section - Dynamic Yield Calculator */}
            <section className="px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8 border-t border-border pt-12">
                        <h2 className="font-serif text-3xl font-medium mb-4">Financial Engineering</h2>
                        <p className="text-muted-foreground">Test the cap rate of your target tickets before requesting the Data Room.</p>
                    </div>
                    <ProfitabilityCalculator basePrice={45000000} baseCapRate={6.2} />
                </div>
            </section>

        </main>
    );
}

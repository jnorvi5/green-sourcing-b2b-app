export const SOCIAL_TEMPLATES = {
    newSupplier: (supplierName: string, productCategory: string) => `
🌱 Welcome to GreenChainz, ${supplierName}!

Another verified sustainable supplier joins our marketplace. Their ${productCategory} now available to 200+ architects committed to green building.

Founding 50 spots filling fast. DM if interested.

#SustainableConstruction #GreenBuilding #CircularEconomy
  `,

    weeklyUpdate: (stats: { suppliers: number; architects: number; rfqs: number }) => `
📊 Week in Review:

✅ ${stats.suppliers} verified suppliers
✅ ${stats.architects} architect signups
✅ ${stats.rfqs} RFQs processed

Q1 2026 launch on track. Follow for updates.

#B2B #PropTech #Sustainability
  `,

    thoughtLeadership: (topic: string) => `
💡 ${topic}

The construction industry is at an inflection point. EPD verification shouldn't take weeks.

We're building the infrastructure to make sustainable procurement as easy as Amazon.

What's holding back green material adoption in your projects?

#ConstructionTech #ESG
  `
};

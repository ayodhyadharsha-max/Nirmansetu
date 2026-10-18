import { NextResponse } from 'next/server';
import { z } from 'zod';

const CalculatorSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('slab_rcc'),
    slabAreaSqFt: z.number().positive('Slab area must be greater than 0'),
    thicknessInches: z.number().min(4).max(12).default(5),
  }),
  z.object({
    type: z.literal('brickwork'),
    wallAreaSqFt: z.number().positive('Wall area must be greater than 0'),
    wallThicknessInches: z.enum(['4.5', '9']).default('9'),
  }),
  z.object({
    type: z.literal('plaster'),
    plasterAreaSqFt: z.number().positive('Plaster area must be greater than 0'),
    thicknessMm: z.enum(['12', '15', '20']).default('12'),
  }),
  z.object({
    type: z.literal('painting'),
    wallAreaSqFt: z.number().positive('Surface area must be greater than 0'),
  }),
]);

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = CalculatorSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const input = result.data;

    if (input.type === 'slab_rcc') {
      // Volume = Area * (Thickness in feet)
      const thicknessFeet = input.thicknessInches / 12;
      const volumeCft = input.slabAreaSqFt * thicknessFeet;
      const volumeM3 = volumeCft * 0.0283168;

      // M20 grade concrete standard factors (IS 456):
      // Approx 8.2 bags cement per m3
      const cementBags = Math.ceil(volumeM3 * 8.2);
      // Approx 78 kg steel per m3 for standard residential slab
      const steelKg = Math.round(volumeM3 * 78);
      // Sand approx 0.45 m3 per m3 concrete -> in cft
      const sandCft = Math.round(volumeCft * 0.44);
      // Aggregate approx 0.85 m3 per m3 concrete -> in cft
      const aggregateCft = Math.round(volumeCft * 0.88);
      // Waterproofing additive (Dr. Fixit LW+) @ 200ml per bag of cement
      const waterproofingLitres = Math.ceil((cementBags * 0.2) * 10) / 10;

      return NextResponse.json({
        success: true,
        type: 'slab_rcc',
        inputs: input,
        estimates: {
          volumeCft: Math.round(volumeCft * 10) / 10,
          volumeM3: Math.round(volumeM3 * 100) / 100,
          materials: [
            { item: 'PPC / OPC Cement (50kg bags)', quantity: cementBags, unit: 'bags', benchmarkPriceRange: '₹370 - ₹410 per bag' },
            { item: 'Fe 550D TMT Steel', quantity: steelKg, unit: 'kg', benchmarkPriceRange: '₹62 - ₹68 per kg' },
            { item: 'M-Sand / Coarse Sand', quantity: sandCft, unit: 'cft', benchmarkPriceRange: '₹42 - ₹52 per cft' },
            { item: 'Blue Metal Aggregate (Gitti 20mm/10mm)', quantity: aggregateCft, unit: 'cft', benchmarkPriceRange: '₹38 - ₹46 per cft' },
            { item: 'Dr. Fixit LW+ Waterproofing', quantity: waterproofingLitres, unit: 'litres', benchmarkPriceRange: '₹160 - ₹180 per litre' },
          ],
        },
      });
    }

    if (input.type === 'brickwork') {
      const isNineInch = input.wallThicknessInches === '9';
      // 9-inch wall: ~950 bricks per 100 sq ft; 4.5-inch wall: ~475 bricks per 100 sq ft
      const brickFactor = isNineInch ? 9.5 : 4.75;
      const totalBricks = Math.ceil(input.wallAreaSqFt * brickFactor);
      // Cement mortar 1:6: ~1.2 bags per 100 sq ft (9-in) or 0.6 bags (4.5-in)
      const cementBags = Math.ceil(input.wallAreaSqFt * (isNineInch ? 0.012 : 0.006));
      // Sand: ~8.5 cft per 100 sq ft (9-in) or 4.2 cft (4.5-in)
      const sandCft = Math.round(input.wallAreaSqFt * (isNineInch ? 0.085 : 0.042));

      return NextResponse.json({
        success: true,
        type: 'brickwork',
        inputs: input,
        estimates: {
          materials: [
            { item: 'Avadh 1st Class Red Bricks', quantity: totalBricks, unit: 'pieces', benchmarkPriceRange: '₹7.50 - ₹8.50 per piece' },
            { item: 'PPC Masonry Cement', quantity: cementBags, unit: 'bags', benchmarkPriceRange: '₹370 - ₹400 per bag' },
            { item: 'River Sand / Fine Plaster Sand', quantity: sandCft, unit: 'cft', benchmarkPriceRange: '₹44 - ₹55 per cft' },
          ],
        },
      });
    }

    if (input.type === 'plaster') {
      // 1:4 mortar for ceiling/external or 1:6 for internal
      const cementFactor = input.thicknessMm === '12' ? 0.0055 : input.thicknessMm === '15' ? 0.007 : 0.009;
      const cementBags = Math.ceil(input.plasterAreaSqFt * cementFactor);
      const sandCft = Math.round(input.plasterAreaSqFt * (Number(input.thicknessMm) / 25.4 / 12) * 1.33);

      return NextResponse.json({
        success: true,
        type: 'plaster',
        inputs: input,
        estimates: {
          materials: [
            { item: 'PPC Cement for Plastering', quantity: cementBags, unit: 'bags', benchmarkPriceRange: '₹370 - ₹400 per bag' },
            { item: 'Screened Plaster Sand', quantity: sandCft, unit: 'cft', benchmarkPriceRange: '₹45 - ₹55 per cft' },
          ],
        },
      });
    }

    if (input.type === 'painting') {
      // 2 coats putty: ~1 kg per 14 sq ft
      const puttyKg = Math.ceil(input.wallAreaSqFt / 14);
      // 1 coat primer: ~1 litre per 110 sq ft
      const primerLitres = Math.ceil(input.wallAreaSqFt / 110);
      // 2 coats emulsion: ~1 litre per 65 sq ft
      const emulsionLitres = Math.ceil(input.wallAreaSqFt / 65);

      return NextResponse.json({
        success: true,
        type: 'painting',
        inputs: input,
        estimates: {
          materials: [
            { item: 'Waterproof Acrylic Wall Putty (2 coats)', quantity: puttyKg, unit: 'kg', benchmarkPriceRange: '₹22 - ₹28 per kg' },
            { item: 'Interior/Exterior Acrylic Primer (1 coat)', quantity: primerLitres, unit: 'litres', benchmarkPriceRange: '₹140 - ₹180 per litre' },
            { item: 'Premium Emulsion Paint (2 coats)', quantity: emulsionLitres, unit: 'litres', benchmarkPriceRange: '₹220 - ₹380 per litre' },
          ],
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown calculator type' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Calculation error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { prisma } from '../src/lib/db';

type PolicyYaml = Array<{
  type: string;
  title: string;
  sourceUrl: string;
  tags?: string[];
  chunks: string[];
}>;

type HotelYaml = {
  hotel: {
    slug: string;
    name: string;
    city?: string;
    sourceUrl?: string;
  };
  documents: Array<{
    type: string;
    title: string;
    sourceUrl: string;
    tags?: string[];
    chunks: string[];
  }>;
};

function readYaml<T>(filepath: string): T {
  const raw = fs.readFileSync(filepath, 'utf8');
  return YAML.parse(raw) as T;
}

function tagsToString(tags?: string[]) {
  return tags?.join(',') ?? null;
}

async function upsertPolicies() {
  const policiesPath = path.join(process.cwd(), 'data/seed/policies.yaml');
  const policies = readYaml<PolicyYaml>(policiesPath);

  // We keep policies as Documents with hotelId = null
  for (const p of policies) {
    for (const chunkText of p.chunks) {
      await prisma.document.create({
        data: {
          hotelId: null,
          type: p.type,
          title: p.title,
          sourceUrl: p.sourceUrl,
          chunkText,
          tags: tagsToString(p.tags),
        },
      });
    }
  }
}

async function upsertHotelFile(filepath: string) {
  const hotelYaml = readYaml<HotelYaml>(filepath);

  const hotel = await prisma.hotel.upsert({
    where: { slug: hotelYaml.hotel.slug },
    update: {
      name: hotelYaml.hotel.name,
      city: hotelYaml.hotel.city,
      sourceUrl: hotelYaml.hotel.sourceUrl,
    },
    create: {
      slug: hotelYaml.hotel.slug,
      name: hotelYaml.hotel.name,
      city: hotelYaml.hotel.city,
      sourceUrl: hotelYaml.hotel.sourceUrl,
    },
  });

  for (const doc of hotelYaml.documents) {
    for (const chunkText of doc.chunks) {
      await prisma.document.create({
        data: {
          hotelId: hotel.id,
          type: doc.type,
          title: doc.title,
          sourceUrl: doc.sourceUrl,
          chunkText,
          tags: tagsToString(doc.tags),
        },
      });
    }
  }
}

async function main() {
  // Clear existing docs/hotels for deterministic seed
  await prisma.feedback.deleteMany();
  await prisma.toolInvocation.deleteMany();
  await prisma.callMessage.deleteMany();
  await prisma.call.deleteMany();
  await prisma.document.deleteMany();
  await prisma.hotel.deleteMany();

  await upsertPolicies();

  const hotelsDir = path.join(process.cwd(), 'data/seed/hotels');
  const files = fs.readdirSync(hotelsDir).filter((f) => f.endsWith('.yaml'));

  for (const file of files) {
    await upsertHotelFile(path.join(hotelsDir, file));
  }

  const hotelCount = await prisma.hotel.count();
  const docCount = await prisma.document.count();
  console.log(`Seed complete: hotels=${hotelCount}, documents=${docCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { createHash } from "node:crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import {
  createNewsSchema,
  ingestNewsSchema,
  updateNewsSchema,
  type NewsKind,
} from "@cardverse/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(kind?: NewsKind) {
    const where: any = { published: true };
    if (kind) where.kind = kind;
    const posts = await this.prisma.newsPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return posts.map(this.serialize);
  }

  async upcomingEvents(limit = 5) {
    const now = new Date();
    const posts = await this.prisma.newsPost.findMany({
      where: { kind: "EVENT", published: true },
      orderBy: [{ eventDate: "asc" }, { createdAt: "desc" }],
      take: limit * 3,
    });
    return posts
      .filter((post) => !post.eventDate || post.eventDate >= now)
      .slice(0, limit)
      .map(this.serialize);
  }

  async detail(slug: string) {
    const post = await this.prisma.newsPost.findUnique({ where: { slug } });
    if (!post || !post.published) throw new NotFoundException("Post not found");
    return this.serialize(post);
  }

  async create(authorId: string, data: any) {
    const input = createNewsSchema.parse(data);
    const slug = input.slug ?? this.slugFrom(input.title);
    const post = await this.prisma.newsPost.create({
      data: {
        slug,
        kind: input.kind,
        title: input.title,
        excerpt: input.excerpt,
        body: input.body,
        imageUrl: input.imageUrl,
        eventDate: this.dateValue(input.eventDate),
        authorId,
      },
    });
    return this.serialize(post);
  }

  async ingest(data: any) {
    const input = ingestNewsSchema.parse(data);
    const existing = await this.prisma.newsPost.findUnique({
      where: { sourceUrl: input.sourceUrl },
    });

    if (existing?.published) return this.serialize(existing);

    const post = existing
      ? await this.prisma.newsPost.update({
          where: { id: existing.id },
          data: {
            kind: input.kind,
            title: input.title,
            excerpt: input.excerpt,
            body: input.body,
            imageUrl: input.imageUrl,
            eventDate: this.dateValue(input.eventDate),
            sourceName: input.sourceName,
            externalId: input.externalId,
            importedAt: new Date(),
            published: false,
          },
        })
      : await this.prisma.newsPost.create({
          data: {
            slug: this.slugFrom(input.title, input.sourceUrl),
            kind: input.kind,
            title: input.title,
            excerpt: input.excerpt,
            body: input.body,
            imageUrl: input.imageUrl,
            eventDate: this.dateValue(input.eventDate),
            sourceUrl: input.sourceUrl,
            sourceName: input.sourceName,
            externalId: input.externalId,
            importedAt: new Date(),
            published: false,
          },
        });

    return this.serialize(post);
  }

  async listAdmin(status?: "draft" | "published") {
    const where =
      status === "draft"
        ? { published: false }
        : status === "published"
          ? { published: true }
          : {};
    const posts = await this.prisma.newsPost.findMany({
      where,
      orderBy: [{ importedAt: "desc" }, { createdAt: "desc" }],
      take: 200,
    });
    return posts.map(this.serialize);
  }

  async update(id: string, data: any) {
    const input = updateNewsSchema.parse(data);
    const post = await this.prisma.newsPost.update({
      where: { id },
      data: {
        slug: input.slug,
        kind: input.kind,
        title: input.title,
        excerpt: input.excerpt,
        body: input.body,
        imageUrl: input.imageUrl,
        eventDate:
          input.eventDate === undefined ? undefined : this.dateValue(input.eventDate),
        sourceUrl: input.sourceUrl,
        sourceName: input.sourceName,
        externalId: input.externalId,
        published: input.published,
      },
    });
    return this.serialize(post);
  }

  async publish(id: string) {
    const post = await this.prisma.newsPost.update({
      where: { id },
      data: { published: true },
    });
    return this.serialize(post);
  }

  async delete(id: string) {
    await this.prisma.newsPost.delete({ where: { id } });
    return { ok: true };
  }

  private slugFrom(value: string, seed?: string) {
    const base = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "news";
    if (!seed) return base;
    const suffix = createHash("sha1").update(seed).digest("hex").slice(0, 8);
    return `${base}-${suffix}`.slice(0, 80);
  }

  private dateValue(value: string | null | undefined) {
    return value ? new Date(value) : null;
  }

  private serialize(p: any) {
    return {
      id: p.id,
      slug: p.slug,
      kind: p.kind,
      title: p.title,
      excerpt: p.excerpt,
      body: p.body,
      imageUrl: p.imageUrl,
      published: p.published,
      eventDate: p.eventDate ? p.eventDate.toISOString() : null,
      sourceUrl: p.sourceUrl,
      sourceName: p.sourceName,
      externalId: p.externalId,
      importedAt: p.importedAt ? p.importedAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}

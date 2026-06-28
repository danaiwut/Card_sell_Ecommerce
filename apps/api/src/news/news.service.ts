import { Injectable, NotFoundException } from "@nestjs/common";
import type { NewsKind } from "@cardverse/shared";
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
    const posts = await this.prisma.newsPost.findMany({
      where: { kind: "EVENT", published: true, eventDate: { gte: new Date() } },
      orderBy: { eventDate: "asc" },
      take: limit,
    });
    return posts.map(this.serialize);
  }

  async detail(slug: string) {
    const post = await this.prisma.newsPost.findUnique({ where: { slug } });
    if (!post) throw new NotFoundException("Post not found");
    return this.serialize(post);
  }

  async create(authorId: string, data: any) {
    const slug =
      data.slug ?? data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
    const post = await this.prisma.newsPost.create({
      data: {
        slug,
        kind: data.kind ?? "NEWS",
        title: data.title,
        excerpt: data.excerpt,
        body: data.body,
        imageUrl: data.imageUrl,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        authorId,
      },
    });
    return this.serialize(post);
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
      eventDate: p.eventDate ? p.eventDate.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
    };
  }
}

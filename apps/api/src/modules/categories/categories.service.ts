import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { categories } from '../../database/schema';
import * as schema from '../../database/schema';

export type CategoryRecord = typeof categories.$inferSelect;

export interface CreateCategoryInput {
  name: string;
  description?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  isActive?: boolean;
}

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async findAll(): Promise<CategoryRecord[]> {
    return this.db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true));
  }

  async create(input: CreateCategoryInput): Promise<CategoryRecord> {
    const [category] = await this.db
      .insert(categories)
      .values({
        name: input.name,
        description: input.description,
      })
      .returning();

    return category;
  }

  async update(
    id: string,
    input: UpdateCategoryInput,
  ): Promise<CategoryRecord> {
    const [existing] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id));

    if (!existing) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    const [updated] = await this.db
      .update(categories)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    return updated;
  }

  async remove(id: string): Promise<CategoryRecord> {
    const [existing] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id));

    if (!existing) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    const [updated] = await this.db
      .update(categories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();

    return updated;
  }
}

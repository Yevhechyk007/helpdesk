import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { users } from '../../database/schema';
import * as schema from '../../database/schema';

export type UserRecord = typeof users.$inferSelect;

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'agent' | 'customer';
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async findByEmail(email: string): Promise<UserRecord | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async findById(id: string): Promise<UserRecord | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async findAll(): Promise<Pick<UserRecord, 'id' | 'firstName' | 'lastName' | 'email' | 'role'>[]> {
    const allUsers = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.isActive, true));
    return allUsers;
  }

  async updateRole(
    id: string,
    role: 'admin' | 'agent' | 'customer',
  ): Promise<Pick<UserRecord, 'id' | 'firstName' | 'lastName' | 'email' | 'role'>> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException('User not found');

    const [updated] = await this.db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
      });

    return updated;
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    const existing = await this.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const [user] = await this.db
      .insert(users)
      .values({
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role ?? 'customer',
      })
      .returning();

    return user;
  }
}

import type { TSchema } from '@sinclair/typebox';
import { t } from 'elysia';

export const Nullable = <T extends TSchema>(schema: T) =>
  t.Union([schema, t.Null()]);

export const Pagination = <T extends TSchema>(itemSchema: T) =>
  t.Object({
    items: t.Array(itemSchema),
    totalItems: t.Integer(),
    pageSize: t.Integer(),
    currentPage: t.Integer(),
    totalPages: t.Integer(),
  });

export const PagArgsSchema = t.Object({
  page: t.Optional(t.Numeric({ default: 1, minimum: 1 })),
  pageSize: t.Optional(t.Numeric({ default: 20, minimum: 1, maximum: 100 })),
});

export type PagArgs = {
  page: number;
  pageSize: number;
};

export const SortDirectionSchema = t.Union([
  t.Literal('asc'),
  t.Literal('desc'),
]);

export type SortDirection = 'asc' | 'desc';

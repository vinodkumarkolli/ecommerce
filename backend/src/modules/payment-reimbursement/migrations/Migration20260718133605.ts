import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260718133605 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "payment_reimbursement" ("id" text not null, "order_id" text not null, "payment_id" text not null, "status" text check ("status" in ('pending_review', 'approved', 'rejected')) not null default 'pending_review', "amount" numeric not null, "currency_code" text not null, "reason" text null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payment_reimbursement_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_reimbursement_deleted_at" ON "payment_reimbursement" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "payment_reimbursement" cascade;`);
  }

}

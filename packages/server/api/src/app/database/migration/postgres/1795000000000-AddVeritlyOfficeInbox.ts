import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddVeritlyOfficeInbox1795000000000 implements MigrationInterface {
    name = 'AddVeritlyOfficeInbox1795000000000'

    public async up(query: QueryRunner): Promise<void> {
        await query.query(
            'CREATE UNIQUE INDEX "uq_flow_id_project_id" ON "flow" ("id", "projectId")',
        )
        await query.query(
            'CREATE UNIQUE INDEX "uq_flow_version_id_flow_id" ON "flow_version" ("id", "flowId")',
        )
        await query.query(
            'CREATE UNIQUE INDEX "uq_flow_run_office_scope" ON "flow_run" ("id", "projectId", "flowId", "flowVersionId")',
        )
        await query.query(`
            CREATE TABLE "veritly_office_registration" (
                "id" character varying(21) PRIMARY KEY,
                "created" timestamp with time zone NOT NULL DEFAULT now(),
                "updated" timestamp with time zone NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "flowId" character varying(21) NOT NULL,
                "flowVersionId" character varying(21) NOT NULL,
                "trigger" character varying(128) NOT NULL,
                "endpoint" character varying(2048) NOT NULL,
                "event" character varying(32) NOT NULL,
                "fileId" character varying(80) NOT NULL,
                "sheetId" character varying(256) NOT NULL,
                "generation" character varying(128) NOT NULL,
                "destinationId" character varying(80),
                "registrationId" character varying(80),
                "webhookId" character varying(80),
                "state" character varying(24) NOT NULL
                    CHECK ("state" IN ('destination_pending', 'hook_pending', 'active', 'deleting', 'idle', 'purging', 'deleted', 'cleanup_failed')),
                "cleanupAt" timestamp with time zone,
                "cleanupAttempts" integer NOT NULL DEFAULT 0 CHECK ("cleanupAttempts" BETWEEN 0 AND 10080),
                "cleanupToken" character varying(128),
                "cleanupExpiresAt" timestamp with time zone,
                "deletedAt" timestamp with time zone,
                CONSTRAINT "fk_office_registration_project"
                    FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_office_registration_flow_scope"
                    FOREIGN KEY ("flowId", "projectId") REFERENCES "flow"("id", "projectId") ON DELETE CASCADE,
                CONSTRAINT "fk_office_registration_version_scope"
                    FOREIGN KEY ("flowVersionId", "flowId") REFERENCES "flow_version"("id", "flowId") ON DELETE CASCADE,
                CONSTRAINT "ck_office_registration_deleted"
                    CHECK (("state" IN ('deleted', 'cleanup_failed')) = ("deletedAt" IS NOT NULL)),
                CONSTRAINT "ck_office_registration_cleanup"
                    CHECK (("state" IN ('destination_pending', 'hook_pending', 'deleting', 'idle', 'purging')) = ("cleanupAt" IS NOT NULL)),
                CONSTRAINT "ck_office_registration_lease"
                    CHECK (("state" = 'purging') = ("cleanupToken" IS NOT NULL AND "cleanupExpiresAt" IS NOT NULL)),
                CONSTRAINT "ck_office_registration_destination"
                    CHECK (
                      ("destinationId" IS NULL) = ("registrationId" IS NULL)
                      AND ("state" NOT IN ('hook_pending', 'active', 'deleting', 'idle', 'deleted') OR "destinationId" IS NOT NULL)
                      AND ("state" <> 'destination_pending' OR "destinationId" IS NULL)
                    ),
                CONSTRAINT "ck_office_registration_webhook"
                    CHECK ("state" NOT IN ('active', 'deleting', 'idle') OR "webhookId" IS NOT NULL)
            )
        `)
        await query.query(
            `CREATE UNIQUE INDEX "uq_office_registration_project_flow_trigger"
             ON "veritly_office_registration" ("projectId", "flowId", "trigger")`,
        )
        await query.query(
            `CREATE UNIQUE INDEX "uq_office_registration_project_webhook"
             ON "veritly_office_registration" ("projectId", "webhookId")`,
        )
        await query.query(
            'CREATE INDEX "idx_office_registration_cleanup" ON "veritly_office_registration" ("state", "cleanupAt")',
        )
        await query.query(
            'CREATE INDEX "idx_office_registration_retention" ON "veritly_office_registration" ("deletedAt")',
        )
        await query.query(`
            CREATE TABLE "veritly_office_inbox" (
                "id" character varying(21) PRIMARY KEY,
                "created" timestamp with time zone NOT NULL DEFAULT now(),
                "updated" timestamp with time zone NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "flowId" character varying(21) NOT NULL,
                "flowVersionId" character varying(21) NOT NULL,
                "trigger" character varying(128) NOT NULL,
                "eventId" character varying(80) NOT NULL,
                "requestHash" character varying(64) NOT NULL CHECK ("requestHash" ~ '^[a-f0-9]{64}$'),
                "payload" jsonb NOT NULL CHECK (jsonb_typeof("payload") = 'object' AND octet_length("payload"::text) <= 262144),
                "runId" character varying(21) NOT NULL,
                "state" character varying(16) NOT NULL CHECK ("state" IN ('queued', 'running', 'succeeded', 'failed')),
                "generation" integer NOT NULL DEFAULT 0 CHECK ("generation" >= 0),
                "commitToken" character varying(128),
                "leaseToken" character varying(128),
                "leaseExpiresAt" timestamp with time zone,
                "terminalAt" timestamp with time zone,
                CONSTRAINT "uq_office_inbox_event"
                    UNIQUE ("projectId", "flowId", "trigger", "eventId"),
                CONSTRAINT "uq_office_inbox_run" UNIQUE ("runId"),
                CONSTRAINT "fk_office_inbox_project"
                    FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_office_inbox_flow_scope"
                    FOREIGN KEY ("flowId", "projectId") REFERENCES "flow"("id", "projectId") ON DELETE CASCADE,
                CONSTRAINT "fk_office_inbox_version_scope"
                    FOREIGN KEY ("flowVersionId", "flowId") REFERENCES "flow_version"("id", "flowId") ON DELETE CASCADE,
                CONSTRAINT "fk_office_inbox_run_scope"
                    FOREIGN KEY ("runId", "projectId", "flowId", "flowVersionId")
                    REFERENCES "flow_run"("id", "projectId", "flowId", "flowVersionId") ON DELETE CASCADE,
                CONSTRAINT "ck_office_inbox_lease"
                    CHECK (("state" = 'running') = ("leaseToken" IS NOT NULL AND "leaseExpiresAt" IS NOT NULL)),
                CONSTRAINT "ck_office_inbox_terminal"
                    CHECK (("state" IN ('succeeded', 'failed')) = ("terminalAt" IS NOT NULL))
            )
        `)
        await query.query(
            'CREATE INDEX "idx_office_inbox_retention" ON "veritly_office_inbox" ("terminalAt")',
        )
        await query.query(`
            CREATE TABLE "veritly_office_effect" (
                "id" character varying(21) PRIMARY KEY,
                "created" timestamp with time zone NOT NULL DEFAULT now(),
                "updated" timestamp with time zone NOT NULL DEFAULT now(),
                "runId" character varying(21) NOT NULL,
                "step" character varying(128) NOT NULL,
                "path" character varying(1024) NOT NULL,
                "policy" character varying(24) NOT NULL
                    CHECK ("policy" IN ('pure', 'idempotent', 'reconcilable', 'non_idempotent')),
                "operationId" character varying(80) NOT NULL,
                "inputHash" character varying(64) NOT NULL CHECK ("inputHash" ~ '^[a-f0-9]{64}$'),
                "state" character varying(24) NOT NULL
                    CHECK ("state" IN ('attempting', 'succeeded', 'outcome_unknown')),
                "output" jsonb CHECK ("output" IS NULL OR octet_length("output"::text) <= 262144),
                "outputHash" character varying(64) CHECK ("outputHash" ~ '^[a-f0-9]{64}$'),
                "terminalAt" timestamp with time zone,
                CONSTRAINT "uq_office_effect_scope" UNIQUE ("runId", "step", "path"),
                CONSTRAINT "uq_office_effect_operation" UNIQUE ("operationId"),
                CONSTRAINT "fk_office_effect_run"
                    FOREIGN KEY ("runId") REFERENCES "flow_run"("id") ON DELETE CASCADE,
                CONSTRAINT "ck_office_effect_terminal"
                    CHECK (("state" = 'attempting') = ("terminalAt" IS NULL)),
                CONSTRAINT "ck_office_effect_output"
                    CHECK (("state" = 'succeeded') OR "output" IS NULL),
                CONSTRAINT "ck_office_effect_output_hash"
                    CHECK (("state" = 'succeeded') = ("outputHash" IS NOT NULL))
            )
        `)
        await query.query(`
            CREATE TABLE "veritly_office_outbox" (
                "id" character varying(21) PRIMARY KEY,
                "created" timestamp with time zone NOT NULL DEFAULT now(),
                "updated" timestamp with time zone NOT NULL DEFAULT now(),
                "runId" character varying(21) NOT NULL,
                "state" character varying(16) NOT NULL CHECK ("state" IN ('pending', 'delivered', 'failed')),
                "failure" character varying(32) CHECK ("failure" IN ('job_invalid', 'enqueue_exhausted')),
                "job" jsonb NOT NULL CHECK (jsonb_typeof("job") = 'object' AND octet_length("job"::text) <= 262144),
                "attempts" integer NOT NULL DEFAULT 0 CHECK ("attempts" BETWEEN 0 AND 10080),
                "availableAt" timestamp with time zone NOT NULL DEFAULT now(),
                "leaseToken" character varying(128),
                "leaseExpiresAt" timestamp with time zone,
                "deliveredAt" timestamp with time zone,
                "terminalAt" timestamp with time zone,
                CONSTRAINT "uq_office_outbox_run" UNIQUE ("runId"),
                CONSTRAINT "fk_office_outbox_run"
                    FOREIGN KEY ("runId") REFERENCES "flow_run"("id") ON DELETE CASCADE,
                CONSTRAINT "ck_office_outbox_delivery"
                    CHECK (("state" = 'delivered') = ("deliveredAt" IS NOT NULL)),
                CONSTRAINT "ck_office_outbox_failure"
                    CHECK (("state" = 'failed') = ("failure" IS NOT NULL)),
                CONSTRAINT "ck_office_outbox_terminal"
                    CHECK (("state" IN ('delivered', 'failed')) = ("terminalAt" IS NOT NULL)),
                CONSTRAINT "ck_office_outbox_lease"
                    CHECK (("leaseToken" IS NULL) = ("leaseExpiresAt" IS NULL))
            )
        `)
        await query.query(
            'CREATE INDEX "idx_office_outbox_pending" ON "veritly_office_outbox" ("state", "availableAt")',
        )
    }

    public async down(query: QueryRunner): Promise<void> {
        await query.query('DROP TABLE "veritly_office_outbox"')
        await query.query('DROP TABLE "veritly_office_effect"')
        await query.query('DROP TABLE "veritly_office_inbox"')
        await query.query('DROP TABLE "veritly_office_registration"')
        await query.query('DROP INDEX "uq_flow_run_office_scope"')
        await query.query('DROP INDEX "uq_flow_version_id_flow_id"')
        await query.query('DROP INDEX "uq_flow_id_project_id"')
    }
}

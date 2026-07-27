import type { ServerContext } from '@activepieces/pieces-framework';
import { type Scoped, type VeritlyUniverEventType } from './types';
export declare function workbooks(server: ServerContext): Promise<any>;
export declare function sheets(server: ServerContext, props: {
    workbook_id: string;
}): Promise<any>;
export declare function rows(server: ServerContext, props: Scoped): Promise<any>;
export declare function find(server: ServerContext, props: Scoped & {
    query?: string;
}): Promise<{
    rows: any;
}>;
export declare function append(server: ServerContext, props: Scoped & {
    values: unknown;
}): Promise<any>;
export declare function update(server: ServerContext, props: Scoped & {
    row_index?: number;
    column_index?: number;
    value: unknown;
}): Promise<any>;
export declare function registerWebhook(server: ServerContext, props: Scoped & {
    event: VeritlyUniverEventType;
    url: string;
}): Promise<any>;
export declare function unregisterWebhook(server: ServerContext, id: string): Promise<any>;
//# sourceMappingURL=client.d.ts.map
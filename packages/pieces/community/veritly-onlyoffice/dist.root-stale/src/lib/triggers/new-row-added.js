"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newRowAdded = void 0;
const tslib_1 = require("tslib");
const pieces_framework_1 = require("@activepieces/pieces-framework");
const univer_contract_1 = require("@veritly/univer-contract");
const client_1 = require("../common/client");
const props_1 = require("../common/props");
const key = 'veritly-univer-new-row-webhook';
function newest(list) {
    return list.slice().sort((a, b) => b.index - a.index);
}
exports.newRowAdded = (0, pieces_framework_1.createTrigger)({
    name: 'new_row_added',
    displayName: 'New Row Added',
    description: 'Triggers when a new row is added to a Veritly Univer sheet.',
    props: props_1.sheet,
    type: pieces_framework_1.TriggerStrategy.WEBHOOK,
    sampleData: {
        index: 12,
        hash: 'row-hash',
        values: ['Dennis', 'new'],
    },
    test(context) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return newest((yield (0, client_1.rows)(server(context), yield (0, props_1.scoped)(context, context.propsValue))).rows).slice(0, 5);
        });
    },
    onEnable(context) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const props = yield (0, props_1.scoped)(context, context.propsValue);
            const hook = yield (0, client_1.registerWebhook)(server(context), Object.assign(Object.assign({}, props), { event: 'new_row_added', url: context.webhookUrl }));
            console.log('[veritly-univer] new_row_added webhook registered', {
                workbook: props.workbook_id,
                sheet: props.sheet_id,
                id: hook.id,
            });
            yield context.store.put(key, hook.id);
        });
    },
    onDisable(context) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const id = yield context.store.get(key);
            if (id)
                yield (0, client_1.unregisterWebhook)(server(context), id);
            yield context.store.delete(key);
        });
    },
    run(context) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            console.log('[veritly-univer] new_row_added webhook payload', {
                type: typeof context.payload.body,
            });
            const body = univer_contract_1.VeritlyUniverWebhookPayload.parse(context.payload.body);
            console.log('[veritly-univer] new_row_added webhook', body.row);
            return [body.row];
        });
    },
});
function server(ctx) {
    const raw = ctx;
    if (!raw.server)
        throw new Error('Activepieces server context is required');
    return raw.server;
}
//# sourceMappingURL=new-row-added.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendRow = void 0;
const tslib_1 = require("tslib");
const pieces_framework_1 = require("@activepieces/pieces-framework");
const client_1 = require("../common/client");
const props_1 = require("../common/props");
exports.appendRow = (0, pieces_framework_1.createAction)({
    name: 'append_row',
    displayName: 'Append Row',
    description: 'Append a row to a Veritly Univer sheet.',
    props: Object.assign(Object.assign({}, props_1.sheet), { values: pieces_framework_1.Property.Json({
            displayName: 'Values',
            description: 'Row values as a JSON array.',
            required: true,
            defaultValue: ['processed'],
        }) }),
    run(context) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            console.log('[veritly-univer] append_row input', {
                workbook: context.propsValue.workbook_id,
                sheet: context.propsValue.sheet_id,
                values: context.propsValue.values,
            });
            const out = yield (0, client_1.append)(context.server, Object.assign(Object.assign({}, (yield (0, props_1.scoped)(context, context.propsValue))), { values: context.propsValue.values }));
            console.log('[veritly-univer] append_row output', out);
            return out;
        });
    },
});
//# sourceMappingURL=append-row.js.map
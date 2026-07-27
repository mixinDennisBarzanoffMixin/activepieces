"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCell = void 0;
const tslib_1 = require("tslib");
const pieces_framework_1 = require("@activepieces/pieces-framework");
const client_1 = require("../common/client");
const props_1 = require("../common/props");
exports.updateCell = (0, pieces_framework_1.createAction)({
    name: 'update_cell',
    displayName: 'Update Cell',
    description: 'Update one cell in a Veritly Univer sheet.',
    props: Object.assign(Object.assign({}, props_1.sheet), { row_index: pieces_framework_1.Property.Number({
            displayName: 'Row Index',
            description: 'Zero-based Univer row index.',
            required: true,
        }), column_index: pieces_framework_1.Property.Number({
            displayName: 'Column Index',
            description: 'Zero-based Univer column index.',
            required: true,
        }), value: pieces_framework_1.Property.ShortText({
            displayName: 'Value',
            description: 'Value to write into the cell.',
            required: true,
        }) }),
    run(context) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield (0, client_1.update)(context.server, Object.assign(Object.assign({}, (yield (0, props_1.scoped)(context, context.propsValue))), { row_index: context.propsValue.row_index, column_index: context.propsValue.column_index, value: context.propsValue.value }));
        });
    },
});
//# sourceMappingURL=update-cell.js.map
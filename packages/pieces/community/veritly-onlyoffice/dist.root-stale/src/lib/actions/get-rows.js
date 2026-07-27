"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRows = void 0;
const tslib_1 = require("tslib");
const pieces_framework_1 = require("@activepieces/pieces-framework");
const client_1 = require("../common/client");
const props_1 = require("../common/props");
exports.getRows = (0, pieces_framework_1.createAction)({
    name: 'get_rows',
    displayName: 'Get Rows',
    description: 'Return rows from a Veritly Univer sheet.',
    props: props_1.sheet,
    run(context) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield (0, client_1.rows)(context.server, yield (0, props_1.scoped)(context, context.propsValue));
        });
    },
});
//# sourceMappingURL=get-rows.js.map
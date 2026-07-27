"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findRows = void 0;
const tslib_1 = require("tslib");
const pieces_framework_1 = require("@activepieces/pieces-framework");
const client_1 = require("../common/client");
const props_1 = require("../common/props");
exports.findRows = (0, pieces_framework_1.createAction)({
    name: 'find_rows',
    displayName: 'Find Rows',
    description: 'Find rows whose values contain the query text.',
    props: Object.assign(Object.assign({}, props_1.sheet), { query: pieces_framework_1.Property.ShortText({
            displayName: 'Query',
            required: true,
        }) }),
    run(context) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield (0, client_1.find)(context.server, Object.assign(Object.assign({}, (yield (0, props_1.scoped)(context, context.propsValue))), { query: context.propsValue.query }));
        });
    },
});
//# sourceMappingURL=find-rows.js.map
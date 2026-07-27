"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sheet = void 0;
exports.scoped = scoped;
const tslib_1 = require("tslib");
const pieces_framework_1 = require("@activepieces/pieces-framework");
const client_1 = require("./client");
exports.sheet = {
    workbook_id: pieces_framework_1.Property.Dropdown({
        auth: undefined,
        displayName: 'Workbook',
        description: 'The Veritly workbook to read or update.',
        required: true,
        refreshers: [],
        options(_props, ctx) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const list = (yield (0, client_1.workbooks)(ctx.server)).workbooks;
                return {
                    disabled: list.length === 0,
                    placeholder: list.length === 0 ? 'No Veritly workbooks found' : 'Select a workbook',
                    options: list.map((item) => ({
                        label: item.name,
                        value: item.id,
                    })),
                };
            });
        },
    }),
    sheet_id: pieces_framework_1.Property.Dropdown({
        auth: undefined,
        displayName: 'Sheet',
        description: 'The worksheet inside the selected workbook.',
        required: true,
        refreshers: ['workbook_id'],
        options(props, ctx) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const book = props['workbook_id'];
                if (typeof book !== 'string' || !book) {
                    return {
                        disabled: true,
                        placeholder: 'Select a workbook first',
                        options: [],
                    };
                }
                const list = (yield (0, client_1.sheets)(ctx.server, { workbook_id: book })).sheets;
                return {
                    disabled: list.length === 0,
                    placeholder: list.length === 0 ? 'No sheets found' : 'Select a sheet',
                    options: list.map((item) => ({
                        label: item.name,
                        value: item.id,
                    })),
                };
            });
        },
    }),
};
function scoped(_ctx, props) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return props;
    });
}
//# sourceMappingURL=props.js.map
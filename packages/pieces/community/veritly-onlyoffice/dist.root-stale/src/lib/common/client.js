"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workbooks = workbooks;
exports.sheets = sheets;
exports.rows = rows;
exports.find = find;
exports.append = append;
exports.update = update;
exports.registerWebhook = registerWebhook;
exports.unregisterWebhook = unregisterWebhook;
const tslib_1 = require("tslib");
const types_1 = require("./types");
function workbooks(server) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return yield client(server).workbooks();
    });
}
function sheets(server, props) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!props.workbook_id)
            throw new Error('Workbook ID is required');
        return yield client(server).sheets(props.workbook_id);
    });
}
function rows(server, props) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return yield client(server).rows((0, types_1.ref)(props));
    });
}
function find(server, props) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!props.query)
            throw new Error('Query is required');
        const q = props.query.toLowerCase();
        return {
            rows: (yield rows(server, props)).rows.filter((item) => item.values.some((value) => String(value).toLowerCase().includes(q))),
        };
    });
}
function append(server, props) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cfg = (0, types_1.ref)(props);
        return yield client(server).append(cfg, (0, types_1.row)(props.values));
    });
}
function update(server, props) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!Number.isFinite(props.row_index))
            throw new Error('Row index is required');
        if (!Number.isFinite(props.column_index))
            throw new Error('Column index is required');
        const r = props.row_index;
        const c = props.column_index;
        if (typeof r !== 'number')
            throw new Error('Row index is required');
        if (typeof c !== 'number')
            throw new Error('Column index is required');
        const cfg = (0, types_1.ref)(props);
        return yield client(server).update(cfg, {
            rowIndex: r,
            columnIndex: c,
            value: (0, types_1.cell)(props.value),
        });
    });
}
function registerWebhook(server, props) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cfg = (0, types_1.ref)(props);
        return yield client(server).registerWebhook({
            event: props.event,
            workbookId: cfg.workbookId,
            sheetId: cfg.sheetId,
            url: props.url,
        });
    });
}
function unregisterWebhook(server, id) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return yield client(server).unregisterWebhook(id);
    });
}
function client(server) {
    return (0, types_1.createUniverClient)({
        baseUrl: server.apiUrl,
        token: server.token,
    });
}
//# sourceMappingURL=client.js.map
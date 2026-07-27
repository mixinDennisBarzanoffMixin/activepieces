"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.veritlyUniver = void 0;
const pieces_framework_1 = require("@activepieces/pieces-framework");
const shared_1 = require("@activepieces/shared");
const append_row_1 = require("./lib/actions/append-row");
const find_rows_1 = require("./lib/actions/find-rows");
const get_rows_1 = require("./lib/actions/get-rows");
const update_cell_1 = require("./lib/actions/update-cell");
const new_row_added_1 = require("./lib/triggers/new-row-added");
const row_changed_1 = require("./lib/triggers/row-changed");
exports.veritlyUniver = (0, pieces_framework_1.createPiece)({
    displayName: 'Veritly Univer',
    description: 'Trigger flows from Veritly Univer sheet changes and update workbook rows.',
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/google-sheets.png',
    authors: ['mixinDennisBarzanoffMixin'],
    categories: [shared_1.PieceCategory.PRODUCTIVITY],
    auth: pieces_framework_1.PieceAuth.None(),
    actions: [append_row_1.appendRow, update_cell_1.updateCell, get_rows_1.getRows, find_rows_1.findRows],
    triggers: [new_row_added_1.newRowAdded, row_changed_1.rowChanged],
});
//# sourceMappingURL=index.js.map
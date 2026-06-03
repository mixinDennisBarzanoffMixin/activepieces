module.exports = {
  meta: {
    type: 'problem',
    fixable: 'code',
    messages: {
      display: 'Solid components do not need React displayName assignments.',
      hook: 'React hook import left over from the migration. Use Solid primitives.',
      jsx: 'React JSX prop left over from the migration. Use the Solid equivalent.',
      map: 'Use Solid <For> instead of mapping arrays inside JSX.',
      react: 'React namespace usage left over from the migration.',
    },
  },
  create(context) {
    const hooks = new Set([
      'useCallback',
      'useContext',
      'useEffect',
      'useId',
      'useLayoutEffect',
      'useMemo',
      'useReducer',
      'useRef',
      'useState',
    ]);

    return {
      AssignmentExpression(node) {
        if (node.left.type !== 'MemberExpression') return;
        if (node.left.property.name !== 'displayName') return;
        context.report({
          node,
          messageId: 'display',
          fix(fixer) {
            const source = context.getSourceCode();
            const parent = node.parent;
            if (parent.type !== 'ExpressionStatement') return null;
            return fixer.removeRange([
              parent.range[0],
              source.getTokenAfter(parent, { includeComments: false })?.value === ';'
                ? source.getTokenAfter(parent).range[1]
                : parent.range[1],
            ]);
          },
        });
      },
      ImportDeclaration(node) {
        if (node.source.value !== 'react') return;
        node.specifiers.forEach((spec) => {
          if (spec.type === 'ImportNamespaceSpecifier') {
            context.report({ node: spec, messageId: 'react' });
            return;
          }
          if (spec.imported && hooks.has(spec.imported.name)) {
            context.report({ node: spec, messageId: 'hook' });
          }
        });
      },
      JSXAttribute(node) {
        if (node.name.name !== 'onChange') return;
        const parent = node.parent;
        if (parent.name.type !== 'JSXIdentifier') return;
        if (!/^[a-z]/.test(parent.name.name)) return;
        context.report({ node, messageId: 'jsx' });
      },
      JSXExpressionContainer(node) {
        if (node.expression.type !== 'CallExpression') return;
        if (node.expression.callee.type !== 'MemberExpression') return;
        if (node.expression.callee.property.name !== 'map') return;
        context.report({ node, messageId: 'map' });
      },
      MemberExpression(node) {
        if (node.object.name !== 'React') return;
        context.report({ node, messageId: 'react' });
      },
    };
  },
};

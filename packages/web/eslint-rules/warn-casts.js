module.exports = {
  meta: {
    type: 'suggestion',
    messages: {
      cast: 'Type assertion cast: verify this is not hiding migration/runtime shape debt.',
    },
  },
  create(context) {
    return {
      TSAsExpression(node) {
        context.report({ node, messageId: 'cast' });
      },
      TSTypeAssertion(node) {
        context.report({ node, messageId: 'cast' });
      },
    };
  },
};

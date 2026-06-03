import { FlowVersionTemplate, Template } from '@activepieces/shared';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function firstFlow(value: unknown): FlowVersionTemplate | null {
  if (!isRecord(value)) {
    return null;
  }
  if (Array.isArray(value.flows) && value.flows.length > 0) {
    return value.flows[0] as FlowVersionTemplate;
  }
  if (isRecord(value.template)) {
    return value.template as FlowVersionTemplate;
  }
  return null;
}

export const templateUtils = {
  parseTemplate: (jsonString: string): Template | null => {
    try {
      const parsed: unknown = JSON.parse(jsonString);
      if (!isRecord(parsed)) {
        return null;
      }

      const template = (() => {
        if (Array.isArray(parsed.flows) && parsed.flows.length > 0) {
          return parsed as Template;
        }
        if (isRecord(parsed.template) && typeof parsed.name === 'string') {
          const { template: _template, ...rest } = parsed;
          return {
            ...rest,
            flows: [parsed.template],
          } as Template;
        }
        return null;
      })();

      if (template === null) {
        return null;
      }

      const flow = firstFlow(template);
      if (flow === null || !template.name || !flow.trigger) {
        return null;
      }

      return template;
    } catch {
      return null;
    }
  },

  extractFlow: (jsonString: string): FlowVersionTemplate | null => {
    try {
      return firstFlow(JSON.parse(jsonString) as unknown);
    } catch {
      return null;
    }
  },
};

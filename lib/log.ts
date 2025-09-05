export const logger = {
  info(event: string, meta: Record<string, any> = {}) {
    console.log(JSON.stringify({ level: 'info', event, ...meta }));
  },
  error(event: string, meta: Record<string, any> = {}) {
    console.error(JSON.stringify({ level: 'error', event, ...meta }));
  },
};

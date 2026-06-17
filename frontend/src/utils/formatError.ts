// src/utils/formatError.ts
export function formatError(error: any): string {
  if (!error) return 'Erreur inconnue';
  if (typeof error === 'string') return error;
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      // Pour les erreurs de validation Pydantic (422)
      return detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
    }
    return JSON.stringify(detail);
  }
  if (error.message) return error.message;
  return JSON.stringify(error);
}
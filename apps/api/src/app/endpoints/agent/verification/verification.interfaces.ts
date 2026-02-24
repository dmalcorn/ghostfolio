export interface VerificationResult {
  type: string;
  passed: boolean;
  details: string;
  severity: 'info' | 'warning' | 'error';
}

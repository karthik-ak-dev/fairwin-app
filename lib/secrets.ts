import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { serverEnv } from '@/lib/env';

const smClient = new SecretsManagerClient({ region: serverEnv.AWS_REGION });

/** Fetch secret on-demand from AWS Secrets Manager. Never cached in memory. */
export async function fetchSecret(secretName: string): Promise<string> {
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await smClient.send(command);
  if (!response.SecretString) throw new Error(`Secret ${secretName} is empty`);
  return response.SecretString;
}

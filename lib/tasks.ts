import { CloudTasksClient } from '@google-cloud/tasks';
import { siteUrl } from './urls';

function hasTasksEnv() {
  return !!(
    process.env.GCP_PROJECT_ID &&
    process.env.CLOUD_TASKS_LOCATION &&
    process.env.CLOUD_TASKS_QUEUE
  );
}

function getTasksClient() {
  const raw = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('Missing env GCP_SERVICE_ACCOUNT_JSON');
  const credentials = JSON.parse(raw);

  return new CloudTasksClient({
    projectId: process.env.GCP_PROJECT_ID,
    credentials,
  });
}

export async function enqueueParseJob(payload: any) {
  const serviceBase =
    (process.env.CLOUD_TASKS_SERVICE_URL || siteUrl('')).replace(/\/$/, '');
  const workerUrl = `${serviceBase}/api/worker/parse`;

  const auth = process.env.TASKS_AUTH_BEARER || '';

  if (!hasTasksEnv()) {
    const res = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${auth}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Worker failed: ${await res.text()}`);
    return { mode: 'direct' as const };
  }

  const client = getTasksClient();
  const parent = client.queuePath(
    process.env.GCP_PROJECT_ID!,
    process.env.CLOUD_TASKS_LOCATION!,
    process.env.CLOUD_TASKS_QUEUE!
  );

  const task = {
    httpRequest: {
      httpMethod: 'POST' as const,
      url: workerUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth}`,
      },
      body: Buffer.from(JSON.stringify(payload)).toString('base64'),
    },
  };

  const [response] = await client.createTask({ parent, task });
  return { mode: 'cloudtasks' as const, name: response.name };
}

/**
 * Pushes eval cases to a LangSmith dataset for external tracking.
 */
import { Client } from "langsmith";

import { isLangSmithTracingEnabled } from "../config/env.js";
import { ALL_EVAL_CASES } from "./scenarios/index.js";

async function findOrCreateDataset(
  client: Client,
  datasetName: string,
): Promise<{ id: string }> {
  for await (const dataset of client.listDatasets({ datasetName })) {
    return dataset;
  }

  return client.createDataset(datasetName, {
    description: "EdPath Gate 6 eval scenarios (~20 cases)",
  });
}

async function main(): Promise<void> {
  if (!isLangSmithTracingEnabled()) {
    console.error(
      "LangSmith not configured. Set LANGSMITH_TRACING=true and LANGSMITH_API_KEY.",
    );
    process.exit(1);
  }

  const client = new Client();
  const datasetName = "edpath-eval-scenarios";
  const dataset = await findOrCreateDataset(client, datasetName);
  console.log(`Using dataset: ${datasetName} (${dataset.id})`);

  for (const evalCase of ALL_EVAL_CASES) {
    await client.createExample(
      {
        pdfText: evalCase.pdf.text,
        script: evalCase.script,
        dimensions: evalCase.dimensions,
      },
      { expected: { category: evalCase.category, tier: evalCase.tier } },
      {
        datasetId: dataset.id,
        metadata: {
          caseId: evalCase.id,
          category: evalCase.category,
          tier: evalCase.tier,
        },
      },
    );
    console.log(`Synced example: ${evalCase.id}`);
  }

  console.log(`Done. ${ALL_EVAL_CASES.length} examples in ${datasetName}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

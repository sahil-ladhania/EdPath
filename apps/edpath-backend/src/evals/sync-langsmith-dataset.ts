/**
 * Pushes eval cases to a LangSmith dataset for external tracking.
**/
import { Client } from "langsmith";
import { isLangSmithTracingEnabled } from "../config/env.js";
import { ALL_EVAL_CASES } from "./scenarios/index.js";

// Define the function to find or create a dataset
async function findOrCreateDataset( client: Client, datasetName: string ): Promise<{ id: string }> {
  // Iterate the datasets
  for await (const dataset of client.listDatasets({ datasetName })) {
    // Return the dataset
    return dataset;
  };

  // Create the dataset
  return client.createDataset(datasetName, {
    description: "EdPath Gate 6 eval scenarios (~20 cases)",
  });
};

// Define the main function
async function main(): Promise<void> {
  // Check if the LangSmith tracing is enabled
  if (!isLangSmithTracingEnabled()) {
    console.error("LangSmith not configured. Set LANGSMITH_TRACING=true and LANGSMITH_API_KEY.");
    process.exit(1);
  };

  // Create the client
  const client = new Client();

  // Define the dataset name
  const datasetName = "edpath-eval-scenarios";

  // Find or create the dataset
  const dataset = await findOrCreateDataset(client, datasetName);

  // Log the dataset
  console.log(`Using dataset: ${datasetName} (${dataset.id})`);

  // Iterate the eval cases
  for (const evalCase of ALL_EVAL_CASES) {
    // Create the example
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
  };

  // Log the done message
  console.log(`Done. ${ALL_EVAL_CASES.length} examples in ${datasetName}.`);
};

// Define the main function
main().catch((error) => {
  // Log the error
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
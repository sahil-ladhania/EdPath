/**
 * CopilotKit runtime mount test suite.
 */
import type { AddressInfo } from "node:net";
import { describe, expect, test } from "vitest";
import { createApp } from "../app.js";
import { COPILOTKIT_ENDPOINT } from "./runtime.js";

// Define the describe block for the CopilotKit runtime mount test suite
describe("CopilotKit runtime mount", () => {
  // Define the test for when the CopilotKit runtime is mounted
  test("mounts the classic runtime endpoint in Express", async () => {
    const app = createApp({
      copilotKit: {
        langGraphDeploymentUrl: "http://127.0.0.1:2024",
      },
    });
    const server = app.listen(0);

    try {
      const address = server.address() as AddressInfo;
      const response = await fetch(
        `http://127.0.0.1:${address.port}${COPILOTKIT_ENDPOINT}`,
      );

      expect(response.status).not.toBe(404);
    } 
    finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  });
});
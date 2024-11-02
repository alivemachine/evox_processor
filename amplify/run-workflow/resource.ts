import { defineFunction } from "@aws-amplify/backend";
    
export const runWorkflow = defineFunction({
  name: "run-workflow",
  entry: "./handler.ts"
});
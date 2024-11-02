import { defineFunction } from "@aws-amplify/backend";
    
export const getWorkflowParams = defineFunction({
  name: "run-workflow",
  entry: "./handler.ts"
});
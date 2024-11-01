import { defineFunction } from "@aws-amplify/backend";
    
export const getWorkflowParams = defineFunction({
  name: "get-workflow-params",
  entry: "./handler.ts"
});
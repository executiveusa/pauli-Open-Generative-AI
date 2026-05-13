"use client";

import React, { useEffect } from "react";
import { WorkflowBuilder } from "workflow-builder";
import "reactflow/dist/style.css";
import "react-toastify/dist/ReactToastify.css";
// workflow-builder/dist/tailwind.css omitted — submodule not present in this build

const WorkflowUI = ({ workflowId, initialNodeSchemas, initialWorkflowData }) => {
  useEffect(() => {
    sessionStorage.setItem("fromWorkflowBuilder", "true");
  }, []);

  return (
    <div className="w-full h-full bg-black">
      <WorkflowBuilder 
        workflowId={workflowId}
        initialNodeSchemas={initialNodeSchemas} 
        initialWorkflowData={initialWorkflowData}
        costType="dollars" 
      />
    </div>
  );
};

export default WorkflowUI;

---
name: Python API workflow path
description: Working-directory behavior for Python services launched by managed artifact workflows.
---

Managed API workflows execute from the API artifact directory rather than the workspace root. Root-level Python packages therefore need a launch command that changes to the workspace root before importing the application module.

**Why:** A module import can pass in a shell started at the workspace root but fail in the managed workflow with `ModuleNotFoundError` when the workflow starts inside `artifacts/<api>`.

**How to apply:** Keep the artifact workflow command explicitly rooted, such as `cd ../.. && python -m python_app.app`, and restart the managed workflow after changing the service command or Python package layout.
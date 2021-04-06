## What's this?
A plugin for managing local declarations.
Keep in mind that this plugin is independent of Blockly's default variable, and declared variables cannot be accessed by field_variable.

## Installation
```bash
npm install blockly-local-variable
```

## Usage
```typescript
import {DeclarationListDirector, DeclarationListBuilder} from 'blockly-local-variable';
...
const localVariableListBuilder = new DeclarationListBuilder("LocalVariable");
const localVariableListDirector = new DeclarationListDirector(localVariableListBuilder);
localVariableListDirector.construct(workspace);
```
Now, you can use custum category named "LOCAL_VARIABLR".

## Reference
https://yukiya383.github.io/blockly-local-variable/

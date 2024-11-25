export function extractCodeFromMessageContent(content: string) {
  return content.match(/```python-app\n([\s\S]*?)```/)?.at(-1);
}

export function extractAppNameFromStliteCode(code: string) {
  return code.match(/st\.title\("([\s\S]*?)"\)/)?.at(-1);
}
